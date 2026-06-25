import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

// Load local secrets from .env. Never expose this key to the browser.
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const TRAFIKVERKET_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";
const API_KEY = process.env.TRAFIKVERKET_API_KEY;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function requireApiKey(_req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      error: "Missing TRAFIKVERKET_API_KEY in .env",
    });
  }
  next();
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function trafikverketRequest(queryXml) {
  const body = `
    <REQUEST>
      <LOGIN authenticationkey="${escapeXml(API_KEY)}" />
      ${queryXml}
    </REQUEST>
  `.trim();

  const response = await fetch(TRAFIKVERKET_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Trafikverket returned ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const result = data?.RESPONSE?.RESULT?.[0];

  if (result?.ERROR) {
    throw new Error(result.ERROR.MESSAGE || "Trafikverket API error");
  }

  return result;
}

function uniqueBySignature(stations) {
  const seen = new Set();
  return stations.filter((station) => {
    if (!station.LocationSignature || seen.has(station.LocationSignature)) return false;
    seen.add(station.LocationSignature);
    return true;
  });
}

function normalizeSearch(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o");
}

function stationScore(station, search) {
  const query = normalizeSearch(search);
  const name = normalizeSearch(station.AdvertisedLocationName);
  const signature = normalizeSearch(station.LocationSignature);

  if (!query) return 50;
  if (signature === query) return 0;
  if (name === query) return 1;
  if (name.startsWith(query)) return 2;
  if (signature.startsWith(query)) return 3;
  if (name.includes(query)) return 4;
  if (signature.includes(query)) return 5;
  return 20;
}

app.get("/api/stations", requireApiKey, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const filter = search
      ? `<OR>
          <LIKE name="AdvertisedLocationName" value="/${escapeXml(search)}/" />
          <LIKE name="LocationSignature" value="/${escapeXml(search)}/" />
        </OR>`
      : `<EQ name="Advertised" value="true" />`;

    const result = await trafikverketRequest(`
      <QUERY objecttype="TrainStation" schemaversion="1.5" limit="200" orderby="AdvertisedLocationName">
        <FILTER>${filter}</FILTER>
        <INCLUDE>AdvertisedLocationName</INCLUDE>
        <INCLUDE>LocationSignature</INCLUDE>
        <INCLUDE>Advertised</INCLUDE>
        <INCLUDE>CountyNo</INCLUDE>
        <INCLUDE>Geometry.WGS84</INCLUDE>
      </QUERY>
    `);

    const stations = uniqueBySignature(result?.TrainStation || [])
      .filter((station) => station.Advertised !== false)
      .sort((a, b) => stationScore(a, search) - stationScore(b, search) || String(a.AdvertisedLocationName).localeCompare(String(b.AdvertisedLocationName), "sv-SE"))
      .map((station) => ({
        name: station.AdvertisedLocationName,
        signature: station.LocationSignature,
        countyNo: station.CountyNo,
        geometry: station.Geometry?.WGS84 || null,
      }));

    res.json(stations);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

app.get("/api/trains", requireApiKey, async (req, res) => {
  try {
    const station = String(req.query.station || "Jö").trim();
    const activity = req.query.activity === "Ankomst" ? "Ankomst" : "Avgang";
    const hours = Math.min(Math.max(Number(req.query.hours || 8), 1), 24);
    const nowOffset = activity === "Avgang" ? "-00:15:00" : "-01:00:00";

    const result = await trafikverketRequest(`
      <QUERY objecttype="TrainAnnouncement" schemaversion="1.9" limit="80" orderby="AdvertisedTimeAtLocation">
        <FILTER>
          <AND>
            <EQ name="LocationSignature" value="${escapeXml(station)}" />
            <EQ name="ActivityType" value="${activity}" />
            <GT name="AdvertisedTimeAtLocation" value="$dateadd(${nowOffset})" />
            <LT name="AdvertisedTimeAtLocation" value="$dateadd(${String(hours).padStart(2, "0")}:00:00)" />
          </AND>
        </FILTER>
        <INCLUDE>ActivityId</INCLUDE>
        <INCLUDE>ActivityType</INCLUDE>
        <INCLUDE>AdvertisedTrainIdent</INCLUDE>
        <INCLUDE>AdvertisedTimeAtLocation</INCLUDE>
        <INCLUDE>EstimatedTimeAtLocation</INCLUDE>
        <INCLUDE>TimeAtLocation</INCLUDE>
        <INCLUDE>Canceled</INCLUDE>
        <INCLUDE>TrackAtLocation</INCLUDE>
        <INCLUDE>ToLocation</INCLUDE>
        <INCLUDE>FromLocation</INCLUDE>
        <INCLUDE>ProductInformation</INCLUDE>
        <INCLUDE>Operator</INCLUDE>
        <INCLUDE>InformationOwner</INCLUDE>
        <INCLUDE>Deviation</INCLUDE>
      </QUERY>
    `);

    res.json(result?.TrainAnnouncement || []);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Train board running at http://localhost:${PORT}`);
});
