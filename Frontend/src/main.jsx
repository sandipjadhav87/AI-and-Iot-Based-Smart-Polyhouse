import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Droplets,
  Gauge,
  Sun,
  Thermometer,
  Wind,
  Leaf,
  BrainCircuit,
  Wifi,
  Database,
  Server,
  Settings,
  Sparkles,
  CloudSun,
  Zap,
  RefreshCw,
  Sprout,
  CheckCircle2,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./style.css";

const API_URL = "http://127.0.0.1:8000";

const initialHistory = [
  { time: "08:00", temp: 25, humidity: 72, soil: 62 },
  { time: "09:00", temp: 26, humidity: 70, soil: 58 },
  { time: "10:00", temp: 27, humidity: 68, soil: 53 },
  { time: "11:00", temp: 29, humidity: 65, soil: 48 },
  { time: "12:00", temp: 31, humidity: 61, soil: 43 },
  { time: "13:00", temp: 32, humidity: 58, soil: 39 },
  { time: "14:00", temp: 33, humidity: 56, soil: 35 },
  { time: "15:00", temp: 32, humidity: 57, soil: 33 },
  { time: "16:00", temp: 31, humidity: 59, soil: 31 },
  { time: "17:00", temp: 30, humidity: 62, soil: 34 },
  { time: "18:00", temp: 28, humidity: 66, soil: 38 },
  { time: "19:00", temp: 27, humidity: 69, soil: 42 },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "crop", label: "Crop Monitoring", icon: Sprout },
  { id: "ai", label: "AI Predictions", icon: BrainCircuit },
  { id: "irrigation", label: "Irrigation", icon: Droplets },
  { id: "system", label: "System", icon: Settings },
];

const pageTitles = {
  dashboard: ["Polyhouse Overview", "AI-powered environmental monitoring & irrigation intelligence"],
  crop: ["Crop Monitoring", "Live environmental conditions for the tomato crop"],
  ai: ["AI Predictions", "Machine-learning recommendations for polyhouse control"],
  irrigation: ["Irrigation Control", "Water requirement and irrigation planning"],
  system: ["System", "Polyhouse configuration, services and architecture"],
};

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [sensorHistory, setSensorHistory] = useState(initialHistory);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/predict`);

      if (!response.ok) throw new Error("Backend request failed");

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());

      setSensorHistory((previous) => {
        const now = new Date();
        const point = {
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temp: Number(result.sensor_data.temperature),
          humidity: Number(result.sensor_data.humidity),
          soil: Number(result.sensor_data.soil_moisture),
        };

        return [...previous, point].slice(-12);
      });

      setLoading(false);
    } catch (error) {
      console.error("Backend connection failed:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon"><Sprout size={42} /></div>
        <h2>Smart Polyhouse</h2>
        <p>Connecting to AI monitoring system...</p>
        <div className="loader"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="error-icon"><Wifi size={40} /></div>
        <h2>Connection Failed</h2>
        <p>Unable to connect with the FastAPI backend.</p>
        <button className="refresh-button" onClick={fetchData}>
          <RefreshCw size={17} />
          Retry Connection
        </button>
      </div>
    );
  }

  const sensor = data.sensor_data;
  const prediction = data.prediction;
  const [pageTitle, pageSubtitle] = pageTitles[activePage];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Leaf size={25} /></div>
          <div>
            <h2>Smart Polyhouse</h2>
            <span>AI AGRITECH PLATFORM</span>
          </div>
        </div>

        <nav className="navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => setActivePage(id)}
              type="button"
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-card-title">
              <span className="status-dot"></span>
              System Online
            </div>
            <p>Firebase Cloud</p>
            <p>FastAPI Backend</p>
            <p>ESP32 Gateway Ready</p>
          </div>
          <div className="version">Smart Polyhouse v1.0</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Agriculture / Smart Polyhouse</div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>

          <div className="top-actions">
            <div className="live-status">
              <span className="status-dot"></span>
              Live System
            </div>
            <button className="icon-button" onClick={fetchData} title="Refresh data">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <section className="live-banner">
          <div className="live-left">
            <div className="live-pulse"><Wifi size={20} /></div>
            <div>
              <strong>Live sensor monitoring active</strong>
              <span>Firebase → FastAPI → AI Prediction Engine</span>
            </div>
          </div>
          <div className="updated">
            Last updated {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
          </div>
        </section>

        {activePage === "dashboard" && (
          <DashboardPage sensor={sensor} prediction={prediction} history={sensorHistory} />
        )}

        {activePage === "crop" && (
          <CropPage sensor={sensor} history={sensorHistory} />
        )}

        {activePage === "ai" && (
          <AIPage sensor={sensor} prediction={prediction} />
        )}

        {activePage === "irrigation" && (
          <IrrigationPage sensor={sensor} prediction={prediction} />
        )}

        {activePage === "system" && (
          <SystemPage prediction={prediction} />
        )}

        <footer>
          Smart Polyhouse • AI-Driven Precision Agriculture
        </footer>
      </main>
    </div>
  );
}

function DashboardPage({ sensor, prediction, history }) {
  return (
    <>
      <SensorSection sensor={sensor} />
      <PredictionSection prediction={prediction} />

      <section className="content-grid">
        <TrendPanel history={history} />
        <AIInsight sensor={sensor} prediction={prediction} />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Smart Control Architecture</h2>
            <p>End-to-end data and AI workflow</p>
          </div>
        </div>

        <ArchitectureFlow />
      </section>

      <section className="bottom-grid">
        <ConfigPanel prediction={prediction} />
        <HealthPanel />
      </section>
    </>
  );
}

function CropPage({ sensor, history }) {
  return (
    <>
      <SensorSection sensor={sensor} />

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Tomato Crop Environment</h2>
            <p>Live status derived from the latest sensor readings</p>
          </div>
          <span className="source-badge"><Wifi size={14} /> Live</span>
        </div>

        <div className="prediction-grid">
          <PredictionCard
            icon={<Thermometer />}
            title="Temperature"
            value={sensor.temperature}
            unit="°C"
            description={Number(sensor.temperature) > 35 ? "High temperature" : "Within monitoring range"}
            accent="orange"
          />
          <PredictionCard
            icon={<CloudSun />}
            title="Humidity"
            value={sensor.humidity}
            unit="%"
            description={Number(sensor.humidity) < 50 ? "Low humidity" : "Current humidity"}
            accent="blue"
          />
          <PredictionCard
            icon={<Droplets />}
            title="Soil Moisture"
            value={sensor.soil_moisture}
            unit="%"
            description={Number(sensor.soil_moisture) < 35 ? "Dry — irrigation needed" : "Moisture available"}
            accent="green"
          />
          <PredictionCard
            icon={<Sun />}
            title="Light"
            value={sensor.light_intensity}
            unit="lux"
            description="Current light intensity"
            accent="purple"
          />
        </div>
      </section>

      <section className="content-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Environmental Trends</h3>
              <p>Live readings collected from the monitoring system</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20352d" />
                <XAxis dataKey="time" stroke="#81958c" tick={{ fontSize: 11 }} />
                <YAxis stroke="#81958c" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="#f6a45c" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="humidity" stroke="#65b9ff" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="soil" stroke="#65d18b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel insight-panel">
          <div className="panel-header">
            <div>
              <h3>Crop Status</h3>
              <p>Tomato growing environment</p>
            </div>
            <Sprout size={20} />
          </div>

          <div className="insight-main">
            <CheckCircle2 size={22} />
            <strong>Environmental data available</strong>
            <p>
              Temperature is <b>{sensor.temperature}°C</b>, humidity is{" "}
              <b>{sensor.humidity}%</b>, and soil moisture is{" "}
              <b>{sensor.soil_moisture}%</b>.
            </p>
          </div>

          <div className="insight-stats">
            <div><span>Crop</span><strong>Tomato</strong></div>
            <div><span>Area</span><strong>1 Acre</strong></div>
            <div><span>Plants</span><strong>10,000</strong></div>
          </div>
        </div>
      </section>
    </>
  );
}

function AIPage({ sensor, prediction }) {
  return (
    <>
      <PredictionSection prediction={prediction} />

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Model Input → AI Output</h2>
            <p>The current sensor values are sent to the three trained models</p>
          </div>
          <div className="ai-badge"><Sparkles size={15} /> AI Powered</div>
        </div>

        <div className="sensor-grid">
          <MetricCard icon={<Thermometer />} title="Temperature Input" value={sensor.temperature} unit="°C" description="Model input" type="temperature" />
          <MetricCard icon={<CloudSun />} title="Humidity Input" value={sensor.humidity} unit="%" description="Model input" type="humidity" />
          <MetricCard icon={<Droplets />} title="Soil Input" value={sensor.soil_moisture} unit="%" description="Model input" type="soil" />
          <MetricCard icon={<Sun />} title="Light Input" value={sensor.light_intensity} unit="lux" description="Model input" type="light" />
        </div>
      </section>

      <section className="panel system-panel">
        <div className="panel-header">
          <div>
            <h3>Current AI Recommendation</h3>
            <p>Outputs returned by FastAPI</p>
          </div>
          <BrainCircuit size={21} />
        </div>

        <div className="config-list">
          <Config label="Irrigation Time" value={`${Number(prediction.irrigation_time).toFixed(2)} min`} />
          <Config label="Ventilation Time" value={`${Number(prediction.fan_time).toFixed(2)} min`} />
          <Config label="Target Temperature" value={`${Number(prediction.target_temperature).toFixed(2)} °C`} />
          <Config label="Estimated Water" value={`${Number(prediction.estimated_water_litres).toFixed(2)} L`} />
        </div>
      </section>
    </>
  );
}

function IrrigationPage({ sensor, prediction }) {
  const flow = Number(prediction.pump_flow_lph || 40000);
  const flowPerMinute = flow / 60;
  const litres = Number(prediction.irrigation_time) * flowPerMinute;

  return (
    <>
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Irrigation Recommendation</h2>
            <p>Calculated from the current soil condition and AI prediction</p>
          </div>
          <div className="ai-badge"><Droplets size={15} /> Smart Irrigation</div>
        </div>

        <div className="prediction-grid">
          <PredictionCard icon={<Droplets />} title="Irrigation Time" value={prediction.irrigation_time} unit="min" description="AI recommended duration" accent="green" />
          <PredictionCard icon={<Gauge />} title="Pump Flow" value={flow} unit="L/hr" description="Configured pump capacity" accent="blue" />
          <PredictionCard icon={<Zap />} title="Water Estimate" value={litres} unit="L" description="Time × pump flow" accent="purple" />
          <PredictionCard icon={<Sprout />} title="Soil Moisture" value={sensor.soil_moisture} unit="%" description="Current root-zone reading" accent="orange" />
        </div>
      </section>

      <section className="content-grid">
        <div className="panel insight-panel">
          <div className="panel-header">
            <div>
              <h3>Irrigation Logic</h3>
              <p>Current decision</p>
            </div>
          </div>
          <div className="insight-main">
            {Number(prediction.irrigation_time) > 0 ? <Droplets size={22} /> : <CheckCircle2 size={22} />}
            <strong>
              {Number(prediction.irrigation_time) > 0
                ? "Irrigation recommended"
                : "No irrigation required"}
            </strong>
            <p>
              Soil moisture is currently <b>{sensor.soil_moisture}%</b>.
              The AI output is <b>{Number(prediction.irrigation_time).toFixed(2)} minutes</b>.
            </p>
          </div>
        </div>

        <div className="panel system-panel">
          <div className="panel-header">
            <div>
              <h3>Pump Configuration</h3>
              <p>Project setup</p>
            </div>
            <Settings size={20} />
          </div>
          <div className="config-list">
            <Config label="Pump Power" value={`${prediction.pump_hp} HP`} />
            <Config label="Flow Rate" value={`${prediction.pump_flow_lph} L/hr`} />
            <Config label="Flow Rate" value={`${flowPerMinute.toFixed(2)} L/min`} />
            <Config label="Irrigation Lines" value="3" />
            <Config label="Crop" value="Tomato" />
            <Config label="Area" value="1 Acre" />
          </div>
        </div>
      </section>
    </>
  );
}

function SystemPage({ prediction }) {
  return (
    <>
      <section className="bottom-grid">
        <ConfigPanel prediction={prediction} />
        <HealthPanel />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>System Architecture</h2>
            <p>How the complete Smart Polyhouse platform works</p>
          </div>
        </div>
        <ArchitectureFlow />
      </section>

      <section className="panel system-panel">
        <div className="panel-header">
          <div>
            <h3>Technology Stack</h3>
            <p>Current software architecture</p>
          </div>
          <Server size={20} />
        </div>

        <div className="config-list">
          <Config label="Frontend" value="React + Vite" />
          <Config label="Backend" value="FastAPI" />
          <Config label="Database" value="Firebase Realtime Database" />
          <Config label="AI Models" value="3 ML Models" />
          <Config label="Controller" value="ESP32" />
          <Config label="Crop" value="Tomato" />
        </div>
      </section>
    </>
  );
}

function SensorSection({ sensor }) {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>Environmental Conditions</h2>
          <p>Real-time sensor readings from the polyhouse</p>
        </div>
        <span className="source-badge"><Database size={14} /> Firebase</span>
      </div>

      <div className="sensor-grid">
        <MetricCard icon={<Thermometer />} title="Temperature" value={sensor.temperature} unit="°C" description="Current air temperature" type="temperature" />
        <MetricCard icon={<CloudSun />} title="Humidity" value={sensor.humidity} unit="%" description="Relative humidity" type="humidity" />
        <MetricCard icon={<Droplets />} title="Soil Moisture" value={sensor.soil_moisture} unit="%" description="Root-zone moisture" type="soil" />
        <MetricCard icon={<Sun />} title="Light Intensity" value={sensor.light_intensity} unit="lux" description="Current light level" type="light" />
      </div>
    </section>
  );
}

function PredictionSection({ prediction }) {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>AI Control Recommendations</h2>
          <p>Predictions generated by the trained ML models</p>
        </div>
        <div className="ai-badge"><Sparkles size={15} /> AI Powered</div>
      </div>

      <div className="prediction-grid">
        <PredictionCard icon={<Droplets />} title="Irrigation" value={prediction.irrigation_time} unit="min" description="Recommended irrigation duration" accent="green" />
        <PredictionCard icon={<Wind />} title="Ventilation" value={prediction.fan_time} unit="min" description="Recommended fan operation" accent="blue" />
        <PredictionCard icon={<Thermometer />} title="Target Temperature" value={prediction.target_temperature} unit="°C" description="AI-recommended temperature" accent="orange" />
        <PredictionCard icon={<Gauge />} title="Water Requirement" value={prediction.estimated_water_litres} unit="L" description="Estimated water consumption" accent="purple" />
      </div>
    </section>
  );
}

function TrendPanel({ history }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <div>
          <h3>Environmental Trends</h3>
          <p>Latest 12 monitoring readings</p>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#20352d" />
            <XAxis dataKey="time" stroke="#81958c" tick={{ fontSize: 11 }} />
            <YAxis stroke="#81958c" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="temp" stroke="#f6a45c" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="humidity" stroke="#65b9ff" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AIInsight({ sensor, prediction }) {
  return (
    <div className="panel insight-panel">
      <div className="panel-header">
        <div className="ai-title">
          <div className="ai-icon"><BrainCircuit size={21} /></div>
          <div>
            <h3>AI Insight</h3>
            <p>Current recommendation</p>
          </div>
        </div>
      </div>

      <div className="insight-main">
        <Sparkles size={20} />
        <strong>
          {Number(prediction.irrigation_time) > 0 ? "Irrigation recommended" : "No irrigation required"}
        </strong>
        <p>
          Current soil moisture is <b>{sensor.soil_moisture}%</b>.
          The AI model recommends <b>{Number(prediction.irrigation_time).toFixed(2)} minutes</b> of irrigation.
        </p>
      </div>

      <div className="insight-stats">
        <div><span>Water</span><strong>{prediction.estimated_water_litres} L</strong></div>
        <div><span>Fan</span><strong>{prediction.fan_time} min</strong></div>
        <div><span>Target</span><strong>{prediction.target_temperature}°C</strong></div>
      </div>
    </div>
  );
}

function ArchitectureFlow() {
  return (
    <div className="architecture">
      <Architecture icon={<Activity />} title="Sensors" text="Temperature, humidity, soil moisture & light" />
      <div className="arrow">→</div>
      <Architecture icon={<Server />} title="ESP32" text="Sensor data acquisition" />
      <div className="arrow">→</div>
      <Architecture icon={<Database />} title="Firebase" text="Real-time cloud database" />
      <div className="arrow">→</div>
      <Architecture icon={<BrainCircuit />} title="AI Engine" text="ML prediction models" />
      <div className="arrow">→</div>
      <Architecture icon={<Zap />} title="Control" text="Irrigation & ventilation" />
    </div>
  );
}

function ConfigPanel({ prediction }) {
  return (
    <div className="panel system-panel">
      <div className="panel-header">
        <div>
          <h3>System Configuration</h3>
          <p>Current project parameters</p>
        </div>
        <Settings size={19} />
      </div>

      <div className="config-list">
        <Config label="Crop" value="Tomato" />
        <Config label="Polyhouse Area" value="1 Acre" />
        <Config label="Plants" value="10,000" />
        <Config label="Irrigation Lines" value="3" />
        <Config label="Pump Capacity" value={`${prediction.pump_hp} HP`} />
        <Config label="Pump Flow" value={`${prediction.pump_flow_lph} L/hr`} />
        <Config label="AI Models" value="3 Active" />
        <Config label="Cloud Database" value="Firebase RTDB" />
      </div>
    </div>
  );
}

function HealthPanel() {
  return (
    <div className="panel health-panel">
      <div className="panel-header">
        <div>
          <h3>System Health</h3>
          <p>Connected services</p>
        </div>
      </div>

      <HealthRow name="Firebase Realtime Database" status="Connected" />
      <HealthRow name="FastAPI Backend" status="Running" />
      <HealthRow name="AI Prediction Engine" status="Active" />
      <HealthRow name="ESP32 Gateway" status="Ready for hardware" />
    </div>
  );
}

function MetricCard({ icon, title, value, unit, description, type }) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-top">
        <div className="metric-icon">{icon}</div>
        <span className="live-dot"></span>
      </div>
      <div className="metric-value">{value}<span>{unit}</span></div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function PredictionCard({ icon, title, value, unit, description, accent }) {
  return (
    <div className={`prediction-card ${accent}`}>
      <div className="prediction-icon">{icon}</div>
      <div>
        <span className="prediction-label">{title}</span>
        <div className="prediction-value">
          {Number(value).toFixed(2)}
          <small>{unit}</small>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Architecture({ icon, title, text }) {
  return (
    <div className="architecture-box">
      <div className="architecture-icon">{icon}</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Config({ label, value }) {
  return (
    <div className="config-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HealthRow({ name, status }) {
  return (
    <div className="health-row">
      <div><span className="health-dot"></span>{name}</div>
      <strong>{status}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
