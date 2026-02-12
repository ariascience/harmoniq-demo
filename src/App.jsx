import { useState, useEffect, useCallback, useRef } from "react";
import CANVAS_REPORTS from "./canvasReports.js";

// ─── Simulated Data ───
const SUPER_AGENTS = [
  { id: "ingestiq", name: "IngestIQ", icon: "📥", color: "#6C5CE7", desc: "Data ingestion, parsing & normalization across formats" },
  { id: "visioniq", name: "VisionIQ", icon: "👁", color: "#00B894", desc: "Visual analytics, chart generation & pattern recognition" },
  { id: "visioniq_plus", name: "VisionIQ+", icon: "🔬", color: "#0984E3", desc: "Advanced computer vision, image/document understanding" },
  { id: "marketiq", name: "MarketIQ", icon: "📊", color: "#E17055", desc: "Market intelligence, competitor analysis & trend detection" },
  { id: "demandiq", name: "DemandIQ", icon: "📈", color: "#FDCB6E", desc: "Demand forecasting, seasonality & inventory optimization" },
  { id: "optimaiq", name: "OptimaIQ", icon: "⚡", color: "#A29BFE", desc: "Decision optimization, scenario planning & recommendations" },
];

const CONNECTORS = [
  { id: "local", name: "Local File Upload", status: "connected", files: [
    { name: "sales_data_2024_Q3Q4.csv", size: "14.2 MB", rows: "148,203", uploaded: "2 hours ago" },
    { name: "inventory_snapshot_jan2025.xlsx", size: "6.8 MB", rows: "52,417", uploaded: "1 day ago" },
    { name: "sku_master_list.csv", size: "1.1 MB", rows: "8,934", uploaded: "3 days ago" },
  ]},
  { id: "database", name: "Database Connection", status: "connected", host: "analytics-prod.aria-is.com", db: "diageo_dw", tables: 24, lastSync: "12 min ago" },
  { id: "gdrive", name: "Google Drive", status: "connected", account: "debonil.chowdhury@aria-is.com", files: [
    { name: "Diageo BTS Promo Calendar.gsheet", size: "3.4 MB", synced: "30 min ago" },
    { name: "Market Intelligence Brief — Feb 2025.gdoc", size: "820 KB", synced: "2 hours ago" },
  ]},
  { id: "icloud", name: "iCloud Drive", status: "disconnected" },
  { id: "onedrive", name: "OneDrive", status: "disconnected" },
  { id: "sharepoint", name: "SharePoint", status: "connected", site: "aria-is.sharepoint.com/sites/diageo", files: [
    { name: "Competitor Pricing Matrix Q1.xlsx", size: "4.7 MB", synced: "1 hour ago" },
  ]},
];

const SAMPLE_TEMPLATES = [
  { id: "t1", name: "Out-of-Stock Impact Trends Report", desc: "Ingests weekly POS sell-through and inventory data, detects emerging OOS patterns at SKU×store level, quantifies lost revenue, and generates a priority replenishment report.", lastRun: "2 hours ago", author: "Debonil Chowdhury", shared: true, status: "active", agents: ["ingestiq", "visioniq", "demandiq", "optimaiq"] },
  { id: "t2", name: "Sales Gap Optimization", desc: "Compares YTD actuals against annual volume targets, identifies the gap by brand and channel, evaluates discount scenarios, and recommends a pricing strategy that closes the gap while preserving minimum margin.", lastRun: "1 day ago", author: "Archana Menon", shared: true, status: "active", agents: ["ingestiq", "marketiq", "demandiq", "optimaiq"] },
  { id: "t3", name: "Competitor Price Monitor", desc: "Scrapes and normalises competitor shelf prices from syndicated feeds, computes price index vs. RRP, estimates cross-price elasticity, and flags products priced >5% above category median.", lastRun: "3 days ago", author: "Subir Gupta", shared: false, status: "draft", agents: ["ingestiq", "visioniq_plus", "marketiq", "optimaiq"] },
  { id: "t4", name: "Demand Forecast Weekly Digest", desc: "Fits ensemble models (ARIMA + Prophet + XGBoost) on 52-week rolling history at SKU level, generates 13-week forward projections with P10/P50/P90 intervals, and flags SKUs with >15% forecast error.", lastRun: "6 hours ago", author: "Debonil Chowdhury", shared: true, status: "active", agents: ["ingestiq", "demandiq", "visioniq"] },
  { id: "t5", name: "Shelf Image Compliance Audit", desc: "Processes store shelf photographs via vision transformers, maps detected facings to the authorised planogram, computes share-of-shelf and compliance scores, and generates a visual exception report.", lastRun: "5 days ago", author: "Neha Kapoor", shared: true, status: "active", agents: ["ingestiq", "visioniq_plus", "marketiq"] },
  { id: "t6", name: "Promotional ROI Analyzer", desc: "Evaluates completed promotional campaigns by isolating incremental lift from baseline demand, calculates ROI per £ of trade spend, and recommends optimisation levers for the next promotional window.", lastRun: "2 days ago", author: "Keith Taylor", shared: false, status: "active", agents: ["ingestiq", "marketiq", "demandiq", "optimaiq", "visioniq"] },
];

const SAMPLE_TRIGGERS = [
  { id: "tr1", template: "Out-of-Stock Impact Trends Report", schedule: "Every Monday 8:00 AM", nextRun: "Mon, Feb 16 08:00", status: "active", lastStatus: "success" },
  { id: "tr2", template: "Demand Forecast Weekly Digest", schedule: "Every Friday 6:00 AM", nextRun: "Fri, Feb 13 06:00", status: "active", lastStatus: "success" },
  { id: "tr3", template: "Competitor Price Monitor", schedule: "Daily 10:00 PM", nextRun: "Today 22:00", status: "paused", lastStatus: "warning" },
  { id: "tr4", template: "Promotional ROI Analyzer", schedule: "Bi-weekly Wednesday 9:00 AM", nextRun: "Wed, Feb 25 09:00", status: "active", lastStatus: "failed" },
];

const SAMPLE_RELICS = [
  { id: "r1", name: "BTS Demand Forecast — 13wk SKU×Store", date: "Feb 12, 2026 08:15 AM", size: "4.2 MB", type: "xlsx", status: "ready", shared: true, sharedBy: null },
  { id: "r2", name: "OOS Impact Trends Report — Wk6", date: "Feb 10, 2026 08:12 AM", size: "2.1 MB", type: "xlsx", status: "ready", shared: true, sharedBy: null },
  { id: "r3", name: "OOS Impact Trends Report — Wk5", date: "Feb 3, 2026 08:09 AM", size: "2.3 MB", type: "xlsx", status: "ready", shared: false, sharedBy: null },
  { id: "r4", name: "Sales Gap Pricing Strategy", date: "Feb 11, 2026 14:30 PM", size: "1.8 MB", type: "pdf", status: "ready", shared: true, sharedBy: "Archana Menon" },
  { id: "r5", name: "Weekly Demand Digest — Feb 7", date: "Feb 7, 2026 06:22 AM", size: "3.1 MB", type: "xlsx", status: "ready", shared: true, sharedBy: "Subir Gupta" },
  { id: "r6", name: "Competitor Price Tracker — Spirits Category", date: "Feb 9, 2026 22:05 PM", size: "0.9 MB", type: "pdf", status: "ready", shared: true, sharedBy: "Neha Kapoor" },
  { id: "r7", name: "Shelf Compliance Audit — Tesco Metro", date: "Feb 8, 2026 11:40 AM", size: "5.7 MB", type: "pdf", status: "ready", shared: false, sharedBy: null },
  { id: "r8", name: "Promo ROI Analysis — Q4 Campaign", date: "Feb 6, 2026 09:15 AM", size: "1.4 MB", type: "csv", status: "ready", shared: true, sharedBy: "Keith Taylor" },
];

const SAMPLE_NOTIFICATIONS = [
  { id: "n1", type: "success", msg: "Out-of-Stock Impact Trends Report completed successfully", time: "2 hours ago", read: false },
  { id: "n2", type: "info", msg: "Archana Menon shared 'Sales Gap Optimization' template with you", time: "5 hours ago", read: false },
  { id: "n3", type: "error", msg: "Promotional ROI Analyzer failed — database connection timeout", time: "1 day ago", read: true },
  { id: "n4", type: "success", msg: "Demand Forecast Weekly Digest completed successfully", time: "2 days ago", read: true },
  { id: "n5", type: "warning", msg: "Competitor Price Monitor completed with warnings — 3 SKUs missing data", time: "3 days ago", read: true },
];

const COLLABORATORS = [
  { id: "u1", name: "Debonil Chowdhury", email: "debonil.chowdhury@aria-is.com", avatar: "DC", role: "Owner" },
  { id: "u2", name: "Archana Menon", email: "archana.menon@aria-is.com", avatar: "AM", role: "Editor" },
  { id: "u3", name: "Subir Gupta", email: "subir.gupta@aria-is.com", avatar: "SG", role: "Editor" },
  { id: "u4", name: "Keith Taylor", email: "keith.taylor@aria-is.com", avatar: "KT", role: "Manager" },
  { id: "u5", name: "Skylar Vanderbilt Smith", email: "skylar.vanderbilt.smith@aria-is.com", avatar: "SV", role: "Viewer" },
  { id: "u6", name: "Neha Kapoor", email: "neha.kapoor@aria-is.com", avatar: "NK", role: "Editor" },
  { id: "u7", name: "Sumit Sengupta", email: "sumit.sengupta@aria-is.com", avatar: "SS", role: "Viewer" },
];

// Each thought has a `delay` (ms to wait BEFORE showing this thought)
// Fast steps: schema detection, handoffs. Slow steps: model fitting, optimization solving, OCR.
const SIMULATED_AGENT_THOUGHTS = {
  ingestiq: [
    { text: "Scanning uploaded data sources...", delay: 400 },
    { text: "Detected 3 files: Sales_Target_Gap_Analysis.xlsx (1.2 MB), KPIs_Data.csv (340 KB), Inventory_Snapshots.parquet (2.8 MB)", delay: 900 },
    { text: "Parsing column headers and inferring schema...", delay: 600 },
    { text: "Schema resolved — 14,328 rows across 3 datasets. 2 date columns, 5 categorical, 12 numeric.", delay: 1800 },
    { text: "Running data quality checks... 267 null values detected (1.8%)", delay: 1200 },
    { text: "Imputing nulls via forward-fill on time-series columns, mode-fill on categoricals.", delay: 2200 },
    { text: "✅ Data pipeline complete. Quality score: 98.2%. Datasets staged for downstream agents.", delay: 500 },
  ],
  visioniq: [
    { text: "Receiving cleaned datasets from IngestIQ...", delay: 350 },
    { text: "Generating visual analytics from processed data...", delay: 700 },
    { text: "Creating time-series decomposition charts for weekly sales (104 weeks)...", delay: 2800 },
    { text: "Rendering comparative bar charts: Target vs Actual by category...", delay: 1600 },
    { text: "Producing heatmap: SKU-level out-of-stock frequency by region (480 SKUs × 12 regions)...", delay: 3200 },
    { text: "✅ 4 visualizations generated. Embedding in output report.", delay: 400 },
  ],
  visioniq_plus: [
    { text: "Initializing advanced document understanding pipeline...", delay: 800 },
    { text: "Loading vision transformer model weights (1.2 GB)...", delay: 3500 },
    { text: "Extracting tabular data from uploaded PDF invoices (8 pages)...", delay: 2400 },
    { text: "Running OCR on shelf images — processing 12 high-res images...", delay: 4200 },
    { text: "Detected 47 product facings across 12 images. Confidence: 94.1%", delay: 1800 },
    { text: "Computing share-of-shelf metrics: Brand A 32%, Brand B 28%, Others 40%.", delay: 1100 },
    { text: "Cross-referencing planogram compliance...", delay: 2600 },
    { text: "✅ Planogram adherence score: 89%. 5 non-compliant facings flagged.", delay: 500 },
  ],
  marketiq: [
    { text: "Fetching competitor pricing signals from configured sources...", delay: 600 },
    { text: "Pulling data from 4 competitor feeds... (2 APIs, 1 scrape, 1 syndicated)", delay: 2800 },
    { text: "Analyzing price elasticity curves for top 20 SKUs...", delay: 3400 },
    { text: "Elasticity analysis complete. 7 SKUs are price-sensitive (|ε| > 1.5).", delay: 1200 },
    { text: "Detected competitor price drop: Brand X reduced SKU-441 by 8.5% on Feb 8...", delay: 800 },
    { text: "Market trend: Category growth +4.2% YoY, our share stable at 23.1%.", delay: 1500 },
    { text: "✅ Competitive intelligence summary compiled. Flagged 3 risk items.", delay: 400 },
  ],
  demandiq: [
    { text: "Loading historical demand data — 104 weeks of sell-through across 480 SKUs...", delay: 1200 },
    { text: "Pre-processing: decomposing seasonality, trend, and residual components...", delay: 2200 },
    { text: "Fitting ARIMA(2,1,2) on 480 SKU-level series...", delay: 4500 },
    { text: "Fitting Prophet with holiday regressors and changepoints...", delay: 3800 },
    { text: "Training XGBoost with 42 engineered features (lag, rolling, fourier)...", delay: 5200 },
    { text: "Cross-validation (5-fold) MAPE: ARIMA 8.1%, Prophet 7.4%, XGBoost 5.9%", delay: 2800 },
    { text: "Blending ensemble weights: ARIMA 0.15, Prophet 0.30, XGBoost 0.55", delay: 900 },
    { text: "Generating 13-week forward forecast with 80% and 95% confidence intervals...", delay: 3200 },
    { text: "✅ Forecast complete. Projected demand: 380,000 units. 12 high-risk SKUs identified for potential stockout.", delay: 600 },
  ],
  optimaiq: [
    { text: "Ingesting forecasts from DemandIQ and intelligence from MarketIQ...", delay: 500 },
    { text: "Formulating multi-objective optimization problem...", delay: 1400 },
    { text: "Objective: maximize revenue, minimize stockout risk, preserve ≥15% margin", delay: 600 },
    { text: "Constraint matrix: 480 SKUs × 12 regions × 4 pricing tiers = 23,040 variables", delay: 1800 },
    { text: "Solving with mixed-integer linear programming (MILP)... iteration 1/8...", delay: 3200 },
    { text: "MILP iteration 4/8... incumbent objective: $392K... improving...", delay: 4800 },
    { text: "MILP iteration 8/8... converged. Optimal gap < 0.01%.", delay: 3600 },
    { text: "Post-processing: mapping solver output to actionable SKU-level recommendations...", delay: 1600 },
    { text: "Optimal strategy: Adjust listings to reach target, apply 7% selective discount on 18 SKUs", delay: 800 },
    { text: "✅ Estimated impact: +41,000 units recovery, $410K incremental sales, 15.2% margin preserved.", delay: 500 },
  ],
};

// Mother agent handoff messages inserted between super agent blocks
const MOTHER_AGENT_HANDOFFS = {
  ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ for data ingestion and normalization...", delay: 600 },
  visioniq: { text: "🧠 HarmonIQ handing off to VisionIQ for visual analytics generation...", delay: 500 },
  visioniq_plus: { text: "🧠 HarmonIQ engaging VisionIQ+ for advanced document and image understanding...", delay: 500 },
  marketiq: { text: "🧠 HarmonIQ delegating to MarketIQ for competitive intelligence analysis...", delay: 500 },
  demandiq: { text: "🧠 HarmonIQ calling DemandIQ for demand forecasting — this is the heavy lift...", delay: 700 },
  optimaiq: { text: "🧠 HarmonIQ invoking OptimaIQ for decision optimization — synthesizing all upstream outputs...", delay: 700 },
};

const SIMULATED_OUTPUT = {
  summary: "Based on ensemble demand modelling across 148K historical transactions and current competitor pricing intelligence, we project a baseline of 380,000 units — a 20K shortfall against the 400K target. Applying a targeted 7% promotional discount on 12 at-risk SKUs (identified via stockout probability scoring) while maintaining list price on top performers lifts the projection to 410,000 units at a 15.2% blended margin.",
  metrics: [
    { label: "Projected Units", value: "410,000", delta: "+7.9% vs baseline" },
    { label: "Revenue Impact", value: "£4.1M", delta: "+12.8%" },
    { label: "Blended Margin", value: "15.2%", delta: "-0.3pp" },
    { label: "At-Risk SKUs Resolved", value: "12 → 3", delta: "-75%" },
  ],
  files: ["Demand_Forecast_13wk_SKUxStore.xlsx", "Pricing_Recommendations_v2.csv", "Executive_Summary_BTS.pdf", "Model_Diagnostics_Report.html"],
};

// ─── Per-Use-Case Realistic Simulated Data ───
const USE_CASE_DATA = {
  t1: {
    inputFiles: [
      { name: "weekly_pos_sellthrough.csv", size: "18.4 MB", rows: "186,422", uploaded: "2 hours ago" },
      { name: "inventory_levels_by_store.xlsx", size: "7.2 MB", rows: "54,310", uploaded: "1 day ago" },
      { name: "sku_master_list.csv", size: "1.1 MB", rows: "8,934", uploaded: "3 days ago" },
    ],
    inputPreview: {
      headers: ["SKU_ID", "Store_ID", "Week_Ending", "Units_Sold", "Stock_On_Hand", "Reorder_Point", "Days_of_Supply"],
      rows: [
        ["SKU-10442", "STR-0821", "2026-01-26", "48", "12", "30", "1.8"],
        ["SKU-10443", "STR-0821", "2026-01-26", "112", "340", "150", "21.8"],
        ["SKU-10442", "STR-1204", "2026-01-26", "36", "0", "30", "0.0"],
        ["SKU-11087", "STR-0415", "2026-01-26", "84", "22", "60", "1.9"],
        ["SKU-10998", "STR-0821", "2026-01-26", "210", "580", "200", "19.8"],
        ["SKU-11234", "STR-0612", "2026-01-26", "18", "5", "25", "2.0"],
        ["SKU-10442", "STR-0415", "2026-01-26", "62", "8", "30", "0.9"],
      ],
    },
    agentThoughts: {
      ingestiq: [
        { text: "Scanning 3 uploaded data sources: weekly_pos_sellthrough.csv, inventory_levels_by_store.xlsx, sku_master_list.csv", delay: 400 },
        { text: "Detected schemas — POS: 186,422 rows × 7 cols; Inventory: 54,310 rows × 9 cols; SKU Master: 8,934 rows × 12 cols", delay: 1100 },
        { text: "Parsing column types: 3 date columns, 4 categorical, 15 numeric. Joining on SKU_ID and Store_ID...", delay: 800 },
        { text: "Running data quality checks... 312 null values detected (0.17% of total cells)", delay: 1400 },
        { text: "Imputing nulls: forward-fill on time-series (Stock_On_Hand), mode-fill on categoricals (Region)", delay: 1800 },
        { text: "✅ Data pipeline complete. Quality score: 99.1%. 249,666 rows staged across 3 joined datasets.", delay: 500 },
      ],
      visioniq: [
        { text: "Receiving cleaned OOS datasets from IngestIQ...", delay: 350 },
        { text: "Generating OOS frequency bar chart by product category (5 categories, 12-week window)...", delay: 2400 },
        { text: "Creating weekly OOS trend line chart — 52 weeks of history with 4-week moving average overlay...", delay: 2800 },
        { text: "Producing SKU × Region OOS density heatmap (480 SKUs × 12 regions)...", delay: 3200 },
        { text: "✅ 3 visualizations generated and embedded in output report.", delay: 400 },
      ],
      demandiq: [
        { text: "Loading 52-week demand history for 480 SKUs across 8 store clusters...", delay: 1200 },
        { text: "Decomposing seasonality, trend, and residual components per SKU...", delay: 2200 },
        { text: "Fitting ARIMA(1,1,1) for short-horizon stockout probability estimation...", delay: 3800 },
        { text: "Fitting Prophet with holiday regressors (Easter, Christmas, Bank Holidays)...", delay: 3200 },
        { text: "Training XGBoost with 38 engineered features (lag, rolling, stock-ratio, velocity)...", delay: 4500 },
        { text: "Cross-validation (5-fold) MAPE: ARIMA 9.4%, Prophet 8.1%, XGBoost 7.2%", delay: 2200 },
        { text: "Generating 13-week stockout probability scores per SKU × store...", delay: 2800 },
        { text: "✅ Stockout risk model complete. 47 SKU×store combinations flagged as high-risk (>70% stockout probability).", delay: 600 },
      ],
      optimaiq: [
        { text: "Ingesting stockout probabilities from DemandIQ and OOS signals from IngestIQ...", delay: 500 },
        { text: "Formulating replenishment optimization problem...", delay: 1200 },
        { text: "Objective: minimize lost sales revenue subject to warehouse capacity and lead-time constraints", delay: 600 },
        { text: "Constraint matrix: 480 SKUs × 4 warehouses = 1,920 decision variables", delay: 1600 },
        { text: "Solving linear program... iteration 1/5... incumbent: £3.2M recovery...", delay: 3200 },
        { text: "LP converged at iteration 5. Optimal replenishment plan covers 94% of at-risk SKUs.", delay: 2800 },
        { text: "Post-processing: mapping solver output to SKU-level reorder quantities and priorities...", delay: 1400 },
        { text: "✅ Estimated recovery: £2.8M in lost sales. Top 15 SKUs account for 63% of total impact.", delay: 500 },
      ],
    },
    motherHandoffs: {
      ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ — ingesting POS sell-through and inventory data...", delay: 600 },
      visioniq: { text: "🧠 HarmonIQ handing off to VisionIQ — generating OOS trend visualizations...", delay: 500 },
      demandiq: { text: "🧠 HarmonIQ calling DemandIQ — building stockout probability models...", delay: 700 },
      optimaiq: { text: "🧠 HarmonIQ invoking OptimaIQ — optimizing replenishment plan to maximize recovery...", delay: 700 },
    },
    output: {
      summary: "Analysis of 186K POS transactions across 480 SKUs identified 847 out-of-stock incidents over the past 12 weeks, concentrated in the Spirits and Ready-to-Drink categories. The top 15 SKUs account for 63% of total lost revenue (£4.2M). Recommended priority replenishment plan targets these SKUs with optimised reorder quantities, projected to recover £2.8M (67%) of lost sales within 4 weeks.",
      metrics: [
        { label: "OOS Incidents", value: "847", delta: "+12% vs prior quarter" },
        { label: "Lost Revenue", value: "£4.2M", delta: "-8% with intervention" },
        { label: "Recovery Rate", value: "67%", delta: "+23pp vs baseline" },
        { label: "Priority SKUs", value: "15", delta: "Top 3.1% of portfolio" },
      ],
      files: ["OOS_Impact_Trends_Wk6.xlsx", "Replenishment_Priority_Report.pdf", "SKU_Risk_Heatmap.html", "Lost_Revenue_Analysis.csv"],
    },
    hitlCheckpoints: {
      ingestiq: { title: "IngestIQ Complete", summary: "Data quality score: 99.1%. 312 nulls imputed via forward-fill. 249,666 rows staged across 3 joined datasets.", recommendation: null },
      visioniq: { title: "VisionIQ Complete", summary: "3 OOS visualizations generated: frequency bar chart, weekly trend line, SKU×Region heatmap.", recommendation: null },
      demandiq: { title: "DemandIQ Complete", summary: "Stockout risk model complete. 47 SKU×store combinations flagged as high-risk (>70% probability).", recommendation: "Consider increasing safety stock levels for the 15 highest-risk SKUs before the promotional window." },
      optimaiq: { title: "OptimaIQ Complete", summary: "Replenishment plan optimized. Covers 94% of at-risk SKUs. £2.8M recovery projected.", recommendation: null },
    },
    constraintAlerts: [
      {
        triggeredBy: "demandiq",
        afterThought: 5,
        severity: "warning",
        title: "High Stockout Risk Threshold Exceeded",
        message: "47 SKU×store combinations show >70% stockout probability, exceeding the 20-SKU threshold. Concentrated in Spirits and RTD categories across Southern region stores.",
        constraint: "High-risk SKUs ≤ 20",
        suggestion: "Narrow the high-risk threshold to >85% probability to focus replenishment on the most critical 18 SKUs, or increase warehouse pre-allocation for Southern region.",
        revisedThoughts: [
          { text: "🔄 Re-running DemandIQ with adjusted threshold: >85% stockout probability...", delay: 1200 },
          { text: "Revised risk scoring — filtering to highest-severity cases only...", delay: 2800 },
          { text: "18 SKU×store combinations now flagged (down from 47). All in Spirits/RTD categories.", delay: 2000 },
          { text: "✅ Revised stockout model complete. 18 critical SKU×store pairs prioritized for immediate replenishment.", delay: 600 },
        ],
      },
      {
        triggeredBy: "optimaiq",
        afterThought: 5,
        severity: "critical",
        title: "Warehouse Capacity Constraint Breached",
        message: "Replenishment plan requires 107% of Southern DC capacity, exceeding the 5% buffer limit. 3 SKU pallets cannot be accommodated.",
        constraint: "Warehouse utilization ≤ 105%",
        suggestion: "Split the replenishment across two delivery windows (Mon + Wed) or redirect 3 pallets to Midlands DC which has 12% spare capacity.",
        revisedThoughts: [
          { text: "🔄 Re-running OptimaIQ with split-delivery constraint...", delay: 1200 },
          { text: "Redistributing 3 pallets to Midlands DC (12% spare capacity available)...", delay: 3200 },
          { text: "Revised plan: Southern DC at 98% utilization, Midlands DC at 94% utilization.", delay: 2000 },
          { text: "✅ Revised replenishment plan within capacity constraints. Recovery maintained at £2.6M (93% of original).", delay: 600 },
        ],
      },
    ],
  },
  t2: {
    inputFiles: [
      { name: "ytd_actuals_by_brand.csv", size: "4.6 MB", rows: "24,180", uploaded: "4 hours ago" },
      { name: "annual_targets_2026.xlsx", size: "1.8 MB", rows: "6,240", uploaded: "1 day ago" },
      { name: "channel_margin_structure.csv", size: "0.4 MB", rows: "1,248", uploaded: "2 days ago" },
    ],
    inputPreview: {
      headers: ["Brand", "Channel", "Region", "YTD_Actual", "Annual_Target", "Gap_Units", "Gap_Pct", "Margin"],
      rows: [
        ["Johnnie Walker", "On-Trade", "London", "42,180", "68,000", "-18,240", "-26.8%", "16.2%"],
        ["Guinness", "Off-Trade", "National", "128,400", "156,000", "-14,100", "-9.0%", "14.8%"],
        ["Baileys", "Off-Trade", "South East", "31,200", "36,500", "-2,840", "-7.8%", "18.4%"],
        ["Tanqueray", "On-Trade", "North West", "18,600", "22,000", "-3,400", "-15.5%", "15.1%"],
        ["Smirnoff", "Off-Trade", "National", "284,000", "295,000", "-11,000", "-3.7%", "12.8%"],
        ["Captain Morgan", "On-Trade", "Midlands", "14,800", "16,200", "-1,400", "-8.6%", "15.9%"],
        ["Gordon's", "Off-Trade", "Scotland", "22,400", "24,800", "-2,400", "-9.7%", "13.5%"],
      ],
    },
    agentThoughts: {
      ingestiq: [
        { text: "Scanning 3 data sources: ytd_actuals_by_brand.csv, annual_targets_2026.xlsx, channel_margin_structure.csv", delay: 400 },
        { text: "Detected schemas — Actuals: 24,180 rows × 8 cols; Targets: 6,240 rows × 6 cols; Margins: 1,248 rows × 5 cols", delay: 900 },
        { text: "Joining datasets on Brand × Channel × Region composite key...", delay: 700 },
        { text: "Running quality checks... 89 null values (0.37%). Imputing via linear interpolation on time-series.", delay: 1400 },
        { text: "Computing gap metrics: Gap_Units = Annual_Target - (YTD_Actual / fraction_of_year_elapsed) × 12", delay: 1100 },
        { text: "✅ Data pipeline complete. Quality score: 99.4%. 31,668 joined rows staged.", delay: 500 },
      ],
      marketiq: [
        { text: "Fetching category growth benchmarks from syndicated data...", delay: 600 },
        { text: "Pulling data from 3 category feeds: Spirits (+3.2% YoY), Beer (+1.1%), Liqueurs (+5.8%)...", delay: 2400 },
        { text: "Comparing brand performance vs market: On-Trade underperforming by -4.2% vs market +1.8%...", delay: 2800 },
        { text: "Cross-referencing competitor promotional intensity — up 22% this quarter vs prior...", delay: 1800 },
        { text: "✅ Market intelligence compiled. 3 brands flagged as at-risk: Johnnie Walker, Guinness, Tanqueray.", delay: 500 },
      ],
      demandiq: [
        { text: "Modelling remaining-year demand trajectory per brand × channel...", delay: 1200 },
        { text: "Fitting Prophet with trend changepoints on 8 brand × 3 channel combinations...", delay: 3800 },
        { text: "Projecting year-end gap at current run-rate: -52,000 units (7.2% below annual target)", delay: 2200 },
        { text: "Simulating discount scenarios: 5%, 7%, 10% across selected underperforming combos...", delay: 4200 },
        { text: "Scenario results — 5%: closes 48% gap; 7%: closes 68%; 10%: closes 89% (but margin drops below floor)", delay: 2600 },
        { text: "✅ Demand scenarios complete. Optimal discount range: 6-7% for maximum gap closure above margin floor.", delay: 600 },
      ],
      optimaiq: [
        { text: "Ingesting demand projections and market intelligence...", delay: 500 },
        { text: "Formulating gap-closing optimization: minimize remaining volume gap while maintaining margin ≥ 14%", delay: 1400 },
        { text: "Evaluating 12 pricing scenarios across 6 brands × 3 channels = 18 decision variables", delay: 1800 },
        { text: "Solving MILP... iteration 1/6... current gap closure: 52%...", delay: 3200 },
        { text: "MILP converged at iteration 6. Optimal: targeted 6.5% discount on 3 brand×channel combos.", delay: 3600 },
        { text: "Projected gap closure: 78% (40,500 units recovered). Margin preserved at 14.3%.", delay: 1200 },
        { text: "✅ Strategy: focus on Johnnie Walker On-Trade, Guinness Off-Trade, Tanqueray On-Trade.", delay: 500 },
      ],
    },
    motherHandoffs: {
      ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ — ingesting YTD actuals and target data...", delay: 600 },
      marketiq: { text: "🧠 HarmonIQ delegating to MarketIQ — analysing category trends and competitor intensity...", delay: 500 },
      demandiq: { text: "🧠 HarmonIQ calling DemandIQ — modelling gap trajectory and discount scenarios...", delay: 700 },
      optimaiq: { text: "🧠 HarmonIQ invoking OptimaIQ — optimizing pricing strategy to close the sales gap...", delay: 700 },
    },
    output: {
      summary: "YTD sales trail the annual target by 52,000 units (7.2%) with the largest gaps in Johnnie Walker On-Trade (-18K) and Guinness Off-Trade (-14K). Market analysis shows competitor promotional intensity increased 22% this quarter. Recommended strategy: apply targeted 6.5% promotional discount to 3 underperforming brand×channel combinations, projected to close 78% of the gap while preserving a 14.3% blended margin.",
      metrics: [
        { label: "Volume Gap", value: "52K units", delta: "-7.2% vs target" },
        { label: "Gap Recovery", value: "78%", delta: "+40.5K units" },
        { label: "Margin Preserved", value: "14.3%", delta: "-0.7pp from baseline" },
        { label: "Brands at Risk", value: "3 of 8", delta: "Down from 5" },
      ],
      files: ["Sales_Gap_Strategy_2026.xlsx", "Pricing_Scenario_Analysis.pdf", "Brand_Channel_Recommendations.csv", "Gap_Waterfall_Chart.html"],
    },
    hitlCheckpoints: {
      ingestiq: { title: "IngestIQ Complete", summary: "Data quality score: 99.4%. 31,668 joined rows staged. Gap metrics computed for 8 brands × 3 channels.", recommendation: null },
      marketiq: { title: "MarketIQ Complete", summary: "Category benchmarks compiled. 3 brands flagged as at-risk. Competitor promo intensity up 22%.", recommendation: "On-Trade channel is underperforming vs market by -4.2%. Consider channel-specific promotional tactics." },
      demandiq: { title: "DemandIQ Complete", summary: "Year-end gap projection: -52K units (7.2%). Optimal discount range: 6-7% for gap closure above margin floor.", recommendation: null },
      optimaiq: { title: "OptimaIQ Complete", summary: "Gap closure strategy: 78% recovery via targeted 6.5% discount on 3 brand×channel combos. Margin at 14.3%.", recommendation: null },
    },
    constraintAlerts: [
      {
        triggeredBy: "demandiq",
        afterThought: 4,
        severity: "warning",
        title: "Gap Closure Below Target",
        message: "At the optimal 7% discount level, gap closure reaches only 68% — below the 75% management target. The 10% discount scenario closes 89% but breaches the margin floor.",
        constraint: "Gap closure ≥ 75%",
        suggestion: "Combine the 7% discount with a targeted display campaign (est. +8% uplift) to reach 76% closure without breaching margin.",
        revisedThoughts: [
          { text: "🔄 Re-running DemandIQ with combined discount + display scenario...", delay: 1200 },
          { text: "Modelling 7% discount + display uplift across 3 underperforming brand×channel combos...", delay: 3800 },
          { text: "Combined scenario projects 76.4% gap closure — above 75% target.", delay: 2000 },
          { text: "Margin impact: 14.1% (above 14% floor). Display cost: additional £45K.", delay: 1800 },
          { text: "✅ Revised scenario meets both gap closure and margin constraints.", delay: 600 },
        ],
      },
      {
        triggeredBy: "optimaiq",
        afterThought: 4,
        severity: "critical",
        title: "Margin Floor Breach Risk",
        message: "The optimized pricing strategy for Johnnie Walker On-Trade results in 13.8% margin — below the 14% floor for premium brands.",
        constraint: "Premium brand margin ≥ 14%",
        suggestion: "Reduce JW On-Trade discount from 6.5% to 5.5% and compensate with increased distribution points (est. +2,200 units).",
        revisedThoughts: [
          { text: "🔄 Re-running OptimaIQ with adjusted JW On-Trade discount ceiling...", delay: 1200 },
          { text: "Reducing JW On-Trade discount to 5.5%, adding 12 distribution points...", delay: 3200 },
          { text: "Revised JW On-Trade margin: 14.4%. Gap closure adjusted to 74.8% (marginal shortfall).", delay: 2200 },
          { text: "✅ All brand margins now above 14% floor. Overall gap closure: 74.8%.", delay: 600 },
        ],
      },
    ],
  },
  t3: {
    inputFiles: [
      { name: "competitor_shelf_prices_q1.csv", size: "8.9 MB", rows: "42,680", uploaded: "3 hours ago" },
      { name: "syndicated_nielsen_data.xlsx", size: "12.3 MB", rows: "98,440", uploaded: "6 hours ago" },
      { name: "internal_rrp_master.csv", size: "0.6 MB", rows: "3,210", uploaded: "1 day ago" },
    ],
    inputPreview: {
      headers: ["SKU", "Product_Name", "Our_Price", "Comp_A", "Comp_B", "Comp_C", "Price_Index", "Category"],
      rows: [
        ["TQ-700", "Tanqueray London Dry 70cl", "£18.50", "£17.99", "£18.25", "£19.50", "101.8", "Gin"],
        ["SM-700", "Smirnoff Red Label 70cl", "£14.25", "£13.99", "£14.50", "£13.75", "102.4", "Vodka"],
        ["JW-BL7", "Johnnie Walker Black 70cl", "£28.00", "£26.50", "£27.75", "£29.00", "104.2", "Whisky"],
        ["GN-440", "Guinness Draught 4×440ml", "£5.80", "£5.50", "£5.75", "£6.00", "103.5", "Beer"],
        ["BA-700", "Baileys Original 70cl", "£13.00", "£12.50", "£13.25", "£12.75", "101.3", "Liqueur"],
        ["CM-700", "Captain Morgan Spiced 70cl", "£16.75", "£16.25", "£16.50", "£17.25", "102.0", "Rum"],
        ["GD-700", "Gordon's London Dry 70cl", "£14.50", "£14.00", "£14.25", "£15.00", "103.1", "Gin"],
      ],
    },
    agentThoughts: {
      ingestiq: [
        { text: "Scanning 3 price feeds: competitor_shelf_prices_q1.csv, syndicated_nielsen_data.xlsx, internal_rrp_master.csv", delay: 400 },
        { text: "Detected 42,680 competitor price records + 98,440 syndicated data points + 3,210 internal RRPs", delay: 1100 },
        { text: "Parsing price formats — converting EUR prices to GBP (14 records), cleaning outliers (14 removed, >5σ)...", delay: 1600 },
        { text: "Normalising to common SKU identifiers across 3 sources... 97.8% match rate achieved.", delay: 2000 },
        { text: "✅ Data pipeline complete. Quality score: 98.8%. 144,330 normalised price records staged.", delay: 500 },
      ],
      visioniq_plus: [
        { text: "Initialising document understanding pipeline for competitor circulars...", delay: 800 },
        { text: "Loading vision transformer model weights (1.2 GB)...", delay: 3200 },
        { text: "Extracting tabular pricing from 6 PDF competitor circulars (24 pages total)...", delay: 3800 },
        { text: "OCR extraction complete. Confidence: 96.2%. 842 price points extracted from PDFs.", delay: 1800 },
        { text: "Cross-referencing extracted prices with digital feeds... 4 discrepancies identified and resolved.", delay: 2200 },
        { text: "✅ Document extraction complete. 842 additional price points merged into dataset.", delay: 500 },
      ],
      marketiq: [
        { text: "Computing price indices for 3,210 SKUs vs category median...", delay: 1800 },
        { text: "Identified 184 SKUs priced >5% above category median (5.7% of portfolio).", delay: 1200 },
        { text: "Estimating cross-price elasticity for top 50 high-value SKUs... |ε| range: 0.8 to 2.4", delay: 3400 },
        { text: "Detected coordinated competitor price drop: Brand X reduced 12 spirits SKUs by avg 6.2% on Feb 3.", delay: 1600 },
        { text: "Category trend: spirits category +2.8% YoY, our share 23.4% (stable).", delay: 800 },
        { text: "✅ Competitive intelligence compiled. 8 high-elasticity SKUs flagged for response.", delay: 400 },
      ],
      optimaiq: [
        { text: "Ingesting price indices and elasticity models from MarketIQ...", delay: 500 },
        { text: "Formulating competitive response strategy: maintain competitiveness while preserving margin...", delay: 1400 },
        { text: "Evaluating 3 response scenarios: Match, Undercut 2%, Hold — across 184 SKUs...", delay: 2800 },
        { text: "Scenario analysis: Match costs -0.8pp margin; Undercut costs -1.4pp; Hold risks £2.1M revenue...", delay: 3400 },
        { text: "Optimal: selectively match on 8 high-elasticity SKUs, hold on 176 low-sensitivity SKUs.", delay: 2200 },
        { text: "✅ Estimated revenue protection: £1.6M with only 0.4pp margin erosion. Strategy ready.", delay: 500 },
      ],
    },
    motherHandoffs: {
      ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ — ingesting competitor price feeds and syndicated data...", delay: 600 },
      visioniq_plus: { text: "🧠 HarmonIQ engaging VisionIQ+ — extracting prices from competitor PDF circulars...", delay: 500 },
      marketiq: { text: "🧠 HarmonIQ delegating to MarketIQ — computing price indices and elasticity models...", delay: 500 },
      optimaiq: { text: "🧠 HarmonIQ invoking OptimaIQ — formulating competitive pricing response strategy...", delay: 700 },
    },
    output: {
      summary: "Monitoring 3,210 SKUs across 3 competitor sets reveals our portfolio is priced 3.2% above category median on average. 184 SKUs (5.7%) exceed the +5% threshold. Competitor A executed a coordinated price reduction across 12 spirits SKUs averaging 6.2%. Cross-price elasticity analysis identifies 8 SKUs where a selective price match would protect an estimated £1.6M in revenue with only 0.4pp margin erosion.",
      metrics: [
        { label: "Avg Price Index", value: "103.2", delta: "+3.2% vs category" },
        { label: "SKUs Above Median", value: "184", delta: "5.7% of portfolio" },
        { label: "Elasticity Alerts", value: "8 critical", delta: "|ε| > 1.8" },
        { label: "Revenue Protection", value: "£1.6M", delta: "-0.4pp margin" },
      ],
      files: ["Competitor_Price_Tracker_Q1.xlsx", "Price_Index_Dashboard.html", "Elasticity_Analysis.pdf", "Competitive_Response_Plan.csv"],
    },
    hitlCheckpoints: {
      ingestiq: { title: "IngestIQ Complete", summary: "Data quality score: 98.8%. 144,330 normalized price records staged from 3 sources.", recommendation: null },
      visioniq_plus: { title: "VisionIQ+ Complete", summary: "842 price points extracted from 6 PDF competitor circulars. OCR confidence: 96.2%.", recommendation: null },
      marketiq: { title: "MarketIQ Complete", summary: "184 SKUs priced >5% above category median. 8 high-elasticity SKUs flagged for response.", recommendation: "Competitor A's coordinated 6.2% price drop across spirits may trigger market-wide repricing within 2 weeks." },
      optimaiq: { title: "OptimaIQ Complete", summary: "Selective match strategy on 8 SKUs protects £1.6M revenue with only 0.4pp margin erosion.", recommendation: null },
    },
    constraintAlerts: [
      {
        triggeredBy: "marketiq",
        afterThought: 1,
        severity: "warning",
        title: "Excessive SKUs Above Category Median",
        message: "184 SKUs are priced >5% above category median — nearly 6% of the portfolio. This exceeds the 150-SKU monitoring threshold and indicates broad overpricing risk.",
        constraint: "SKUs above median ≤ 150",
        suggestion: "Focus analysis on the top 50 SKUs by revenue impact. The remaining 134 low-volume SKUs contribute <8% of total revenue.",
        revisedThoughts: [
          { text: "🔄 Re-running MarketIQ with revenue-weighted prioritization...", delay: 1200 },
          { text: "Filtering to top 50 SKUs by revenue contribution (92% of total)...", delay: 2800 },
          { text: "Revised analysis: 50 high-impact SKUs priced >5% above median. 134 low-volume SKUs deprioritized.", delay: 2000 },
          { text: "✅ Focused competitive analysis complete. 8 high-elasticity SKUs confirmed for immediate response.", delay: 600 },
        ],
      },
      {
        triggeredBy: "optimaiq",
        afterThought: 4,
        severity: "warning",
        title: "Margin Erosion Threshold Risk",
        message: "If Competitor A's price drop triggers a broader market response, our matching strategy could erode margin by up to 1.2pp — exceeding the 1pp limit.",
        constraint: "Margin erosion ≤ 1pp",
        suggestion: "Implement time-limited price match (4 weeks) with automatic review trigger, rather than permanent repricing.",
        revisedThoughts: [
          { text: "🔄 Re-running OptimaIQ with time-limited price match constraint...", delay: 1200 },
          { text: "Modelling 4-week temporary match on 8 SKUs with auto-revert clause...", delay: 3200 },
          { text: "Revised margin impact: -0.6pp during match window, reverting to baseline after 4 weeks.", delay: 2200 },
          { text: "✅ Time-limited strategy: £1.4M revenue protection, 0.6pp max erosion within threshold.", delay: 600 },
        ],
      },
    ],
  },
  t4: {
    inputFiles: [
      { name: "historical_demand_52wk.csv", size: "22.1 MB", rows: "214,560", uploaded: "1 hour ago" },
      { name: "promotional_calendar_2026.xlsx", size: "0.8 MB", rows: "2,340", uploaded: "2 days ago" },
      { name: "holiday_event_flags.csv", size: "0.1 MB", rows: "365", uploaded: "5 days ago" },
    ],
    inputPreview: {
      headers: ["SKU_ID", "Week_Num", "Units_Sold", "Promo_Flag", "Holiday", "Price_GBP", "Rolling_4wk", "YoY_Growth"],
      rows: [
        ["SKU-10442", "W01", "482", "0", "New Year", "£18.50", "468", "+4.2%"],
        ["SKU-10442", "W02", "445", "0", "—", "£18.50", "471", "+3.1%"],
        ["SKU-10443", "W01", "1,204", "1", "New Year", "£14.25", "1,180", "+6.8%"],
        ["SKU-11087", "W01", "856", "0", "New Year", "£28.00", "812", "-1.4%"],
        ["SKU-10998", "W02", "2,180", "1", "—", "£5.80", "2,050", "+8.2%"],
        ["SKU-11234", "W01", "198", "0", "New Year", "£13.00", "184", "-2.1%"],
        ["SKU-10442", "W03", "510", "1", "—", "£17.50", "479", "+5.6%"],
      ],
    },
    agentThoughts: {
      ingestiq: [
        { text: "Scanning 3 sources: historical_demand_52wk.csv, promotional_calendar_2026.xlsx, holiday_event_flags.csv", delay: 400 },
        { text: "Detected 214,560 demand records spanning 52 weeks × 480 SKUs × ~8 store clusters", delay: 1000 },
        { text: "Validating date continuity... 2 gaps detected (W17, W32) — filled via interpolation.", delay: 1400 },
        { text: "Cross-referencing promotional calendar: 2,340 promo events mapped to demand records.", delay: 900 },
        { text: "✅ Data pipeline complete. Quality score: 99.3%. 217,265 enriched demand records staged.", delay: 500 },
      ],
      demandiq: [
        { text: "Loading 52-week demand history per SKU — 480 time series × 52 observations each...", delay: 1200 },
        { text: "Decomposing components: trend (+2.1% YoY), seasonality (peaks W22-26, W48-52), residual...", delay: 2400 },
        { text: "Fitting ARIMA(2,1,2) on 480 SKU-level series... completed in 18.4s.", delay: 4200 },
        { text: "Fitting Prophet with 12 holiday regressors and 3 trend changepoints...", delay: 3800 },
        { text: "Training XGBoost with 42 engineered features (lag-1→8, rolling mean/std, fourier, promo×price)...", delay: 5200 },
        { text: "5-fold cross-validation MAPE: ARIMA 8.1%, Prophet 7.4%, XGBoost 5.9%", delay: 2600 },
        { text: "Blending ensemble weights: ARIMA 0.15, Prophet 0.30, XGBoost 0.55", delay: 800 },
        { text: "Generating 13-week forward projection with P10 / P50 / P90 confidence intervals...", delay: 3200 },
        { text: "✅ Forecast complete. Projected demand: 392,000 units. 14 high-risk SKUs flagged (error >15%).", delay: 600 },
      ],
      visioniq: [
        { text: "Receiving forecast outputs from DemandIQ...", delay: 350 },
        { text: "Generating line chart with P10/P50/P90 confidence bands for top 20 SKUs...", delay: 2800 },
        { text: "Creating MAPE distribution bar chart by product category (6 categories)...", delay: 1800 },
        { text: "Producing seasonal strength heatmap by SKU cluster (8 clusters × 52 weeks)...", delay: 3000 },
        { text: "✅ 4 forecast visualizations generated. Embedding in weekly digest report.", delay: 400 },
      ],
    },
    motherHandoffs: {
      ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ — ingesting 52-week demand history and promo calendar...", delay: 600 },
      demandiq: { text: "🧠 HarmonIQ calling DemandIQ — this is the heavy lift: ensemble demand forecasting...", delay: 700 },
      visioniq: { text: "🧠 HarmonIQ handing off to VisionIQ — generating forecast visualization suite...", delay: 500 },
    },
    output: {
      summary: "Ensemble demand model (ARIMA + Prophet + XGBoost) fitted on 214K data points across 480 SKUs projects total 13-week demand of 392,000 units with blended MAPE of 6.4%. Peak demand expected in weeks 8-10 driven by Easter promotional activity. 14 SKUs flagged for forecast error >15%, concentrated in the new product launches segment where limited history constrains model accuracy.",
      metrics: [
        { label: "Projected Demand", value: "392K units", delta: "+3.8% vs prior 13wk" },
        { label: "Forecast MAPE", value: "6.4%", delta: "-1.2pp improvement" },
        { label: "High-Risk SKUs", value: "14", delta: "2.9% of portfolio" },
        { label: "Confidence Coverage", value: "94.1%", delta: "P80 interval" },
      ],
      files: ["Demand_Forecast_13wk.xlsx", "Forecast_Accuracy_Report.pdf", "SKU_Risk_Flags.csv", "Forecast_Visualization_Suite.html"],
    },
    hitlCheckpoints: {
      ingestiq: { title: "IngestIQ Complete", summary: "Data quality score: 99.3%. 217,265 enriched demand records staged. 2 date gaps interpolated.", recommendation: null },
      demandiq: { title: "DemandIQ Complete", summary: "Ensemble forecast complete. Blended MAPE: 6.4%. 14 high-risk SKUs flagged (error >15%).", recommendation: "Consider excluding new product launches from ensemble due to limited history (<8 weeks)." },
      visioniq: { title: "VisionIQ Complete", summary: "4 forecast visualizations generated: confidence bands, MAPE distribution, seasonal heatmap, trend decomposition.", recommendation: null },
    },
    constraintAlerts: [
      {
        triggeredBy: "demandiq",
        afterThought: 5,
        severity: "warning",
        title: "Forecast Error Threshold Exceeded",
        message: "14 SKUs show MAPE >15%, above the 10% target. These are concentrated in new product launches with <8 weeks of history.",
        constraint: "MAPE ≤ 10% per SKU",
        suggestion: "Exclude new product launches from the ensemble model and use analogous product proxies instead.",
        revisedThoughts: [
          { text: "🔄 Re-running DemandIQ with user adjustment: excluding 14 new product SKUs from ensemble...", delay: 1200 },
          { text: "Fitting revised XGBoost on 466 SKUs (excluded 14 new launches)...", delay: 3800 },
          { text: "Using analogous product proxy for excluded SKUs — mapped to 8 similar mature SKUs.", delay: 2200 },
          { text: "Revised cross-validation MAPE: ARIMA 7.8%, Prophet 6.9%, XGBoost 5.2%", delay: 2000 },
          { text: "✅ Revised forecast complete. All SKUs now within 10% MAPE threshold. 0 high-risk SKUs remaining.", delay: 600 },
        ],
      },
      {
        triggeredBy: "demandiq",
        afterThought: 8,
        severity: "warning",
        title: "High-Risk SKU Count Exceeds Limit",
        message: "14 SKUs flagged as high-risk exceeds the 10-SKU reporting threshold. Weekly digest will have an unusually large exception section.",
        constraint: "High-risk SKUs ≤ 10",
        suggestion: "Raise the flagging threshold from 15% to 18% MAPE to reduce noise, or group by product family for a cleaner report.",
        revisedThoughts: [
          { text: "🔄 Adjusting risk flagging threshold to 18% MAPE...", delay: 1000 },
          { text: "Re-classifying SKUs with 15-18% MAPE as 'monitor' tier instead of 'high-risk'...", delay: 2000 },
          { text: "Revised: 6 high-risk SKUs (>18% MAPE), 8 monitor-tier SKUs (15-18% MAPE).", delay: 1800 },
          { text: "✅ Digest report restructured with tiered risk categories. 6 high-risk + 8 monitor.", delay: 600 },
        ],
      },
    ],
  },
  t5: {
    inputFiles: [
      { name: "shelf_images_batch_feb.csv", size: "0.3 MB", rows: "156", uploaded: "5 hours ago" },
      { name: "authorised_planogram_v4.xlsx", size: "1.2 MB", rows: "3,840", uploaded: "1 week ago" },
      { name: "store_audit_schedule.csv", size: "0.1 MB", rows: "248", uploaded: "3 days ago" },
    ],
    inputPreview: {
      headers: ["Image_ID", "Store_ID", "Store_Name", "Aisle", "Capture_Date", "Region", "Resolution", "Status"],
      rows: [
        ["IMG-0421", "STR-0102", "Tesco Metro Kings Cross", "Spirits", "2026-02-08", "London", "1920×1080", "Pending"],
        ["IMG-0422", "STR-0102", "Tesco Metro Kings Cross", "Beer & Cider", "2026-02-08", "London", "1920×1080", "Pending"],
        ["IMG-0423", "STR-0205", "Sainsburys Local Camden", "Spirits", "2026-02-09", "London", "1920×1080", "Pending"],
        ["IMG-0424", "STR-0318", "Asda Superstore Leeds", "Spirits", "2026-02-07", "North", "1920×1080", "Pending"],
        ["IMG-0425", "STR-0412", "Morrisons Birmingham", "RTD", "2026-02-06", "Midlands", "1920×1080", "Pending"],
        ["IMG-0426", "STR-0515", "Waitrose Guildford", "Spirits", "2026-02-09", "South East", "1920×1080", "Pending"],
        ["IMG-0427", "STR-0621", "Co-op Manchester", "Beer & Cider", "2026-02-07", "North West", "1920×1080", "Pending"],
      ],
    },
    agentThoughts: {
      ingestiq: [
        { text: "Scanning 3 sources: shelf_images_batch_feb.csv, authorised_planogram_v4.xlsx, store_audit_schedule.csv", delay: 400 },
        { text: "Detected 156 shelf image metadata records linked to 48 unique stores across 5 regions.", delay: 800 },
        { text: "Linking planogram specifications: 3,840 authorised facing positions across 12 product categories.", delay: 1200 },
        { text: "Validating image file references... 3 broken links flagged (IMG-0489, IMG-0502, IMG-0511). Excluded.", delay: 1600 },
        { text: "✅ Data pipeline complete. Quality score: 98.1%. 153 valid images staged for vision processing.", delay: 500 },
      ],
      visioniq_plus: [
        { text: "Loading ViT-Large vision transformer model (1.2 GB parameter weights)...", delay: 3500 },
        { text: "Processing 153 shelf images at 1920×1080 resolution using YOLO v8 + SAM segmentation...", delay: 4800 },
        { text: "Batch 1/4 complete (38 images)... 712 product facings detected so far...", delay: 3200 },
        { text: "All batches complete. Total: 2,847 product facings detected across 153 images. Confidence: 94.8%.", delay: 2200 },
        { text: "Computing share-of-shelf per brand per store: Our Brand 31.4%, Comp A 24.2%, Comp B 18.6%...", delay: 1800 },
        { text: "Cross-referencing against authorised planogram... overall compliance: 89.2%.", delay: 2400 },
        { text: "47 non-compliant facing positions flagged across 12 stores. Generating annotated overlays...", delay: 1600 },
        { text: "✅ Vision processing complete. Compliance report with annotated images ready.", delay: 500 },
      ],
      marketiq: [
        { text: "Benchmarking compliance against industry standard (85% average)... our 89.2% is +4.2pp above.", delay: 1200 },
        { text: "Analysing regional variation: London 92.1%, South East 90.4%, North West 88.2%, East 87.1%, Midlands 84.7%.", delay: 2200 },
        { text: "Correlating compliance scores with sell-through performance at store level...", delay: 2800 },
        { text: "Insight: stores with >90% compliance show +8.4% higher sell-through vs stores below 85%.", delay: 1400 },
        { text: "✅ 5 stores flagged for priority re-merchandising in Midlands and East regions.", delay: 500 },
      ],
    },
    motherHandoffs: {
      ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ — ingesting shelf image metadata and planogram specs...", delay: 600 },
      visioniq_plus: { text: "🧠 HarmonIQ engaging VisionIQ+ — running vision AI on 153 shelf images (this will take a moment)...", delay: 600 },
      marketiq: { text: "🧠 HarmonIQ delegating to MarketIQ — benchmarking compliance and correlating with sales...", delay: 500 },
    },
    output: {
      summary: "Vision AI analysis of 153 shelf images across 48 stores detected 2,847 product facings with 94.8% detection confidence. Overall planogram compliance is 89.2%, above the 85% industry benchmark. London region leads at 92.1% while Midlands lags at 84.7%. 47 non-compliant facing positions identified, primarily in the spirits aisle where competitor SKUs are displacing authorised facings. Stores with full compliance show 8.4% higher sell-through rates.",
      metrics: [
        { label: "Compliance Score", value: "89.2%", delta: "+4.2pp vs benchmark" },
        { label: "Non-Compliant Facings", value: "47", delta: "Across 12 stores" },
        { label: "Share of Shelf", value: "31.4%", delta: "vs 28% target" },
        { label: "Stores Audited", value: "48", delta: "92% coverage" },
      ],
      files: ["Shelf_Compliance_Report.pdf", "Store_Compliance_Scores.xlsx", "Non_Compliant_Facings_Detail.csv", "Annotated_Shelf_Images.html"],
    },
    hitlCheckpoints: {
      ingestiq: { title: "IngestIQ Complete", summary: "Data quality score: 98.1%. 153 valid images staged. 3 broken image links excluded.", recommendation: null },
      visioniq_plus: { title: "VisionIQ+ Complete", summary: "2,847 product facings detected across 153 images. Confidence: 94.8%. Compliance: 89.2%.", recommendation: "47 non-compliant facings detected — consider a priority re-merchandising visit for the 5 worst stores." },
      marketiq: { title: "MarketIQ Complete", summary: "Compliance benchmarked at +4.2pp above industry (89.2% vs 85%). 5 stores flagged for priority action.", recommendation: null },
    },
    constraintAlerts: [
      {
        triggeredBy: "visioniq_plus",
        afterThought: 3,
        severity: "warning",
        title: "Detection Confidence Below Target",
        message: "Batch 2 images from North region stores show 88.4% detection confidence — below the 90% quality threshold. Poor lighting in 12 images is the primary cause.",
        constraint: "Detection confidence ≥ 90%",
        suggestion: "Re-run vision processing with enhanced preprocessing (brightness normalization + contrast enhancement) for the 12 affected images.",
        revisedThoughts: [
          { text: "🔄 Re-running VisionIQ+ with enhanced image preprocessing...", delay: 1200 },
          { text: "Applying brightness normalization and contrast enhancement to 12 North region images...", delay: 3200 },
          { text: "Reprocessing batch 2 with enhanced images... detection improved significantly.", delay: 2800 },
          { text: "Revised detection confidence: 93.2% (up from 88.4%). 38 additional facings detected.", delay: 2000 },
          { text: "✅ All image batches now above 90% confidence threshold.", delay: 600 },
        ],
      },
      {
        triggeredBy: "marketiq",
        afterThought: 1,
        severity: "critical",
        title: "Regional Compliance Below Industry Benchmark",
        message: "Midlands region compliance score is 84.7% — below the 85% industry benchmark. This represents 8 stores with significant planogram deviations.",
        constraint: "All regions ≥ 85% compliance",
        suggestion: "Flag Midlands region for immediate field team intervention. Prioritize the 3 stores with <80% compliance for same-week re-merchandising visits.",
        revisedThoughts: [
          { text: "🔄 Re-analyzing Midlands region with store-level granularity...", delay: 1200 },
          { text: "Identifying root causes: 3 stores below 80%, 5 stores between 80-85%...", delay: 2800 },
          { text: "Primary issue: unauthorized competitor display stands in spirits aisle at 3 stores.", delay: 2200 },
          { text: "Generating priority re-merchandising schedule with estimated compliance uplift per store...", delay: 1800 },
          { text: "✅ Midlands intervention plan ready. Projected post-visit compliance: 88.1% (above benchmark).", delay: 600 },
        ],
      },
    ],
  },
  t6: {
    inputFiles: [
      { name: "promo_campaigns_h2_2025.csv", size: "5.8 MB", rows: "34,260", uploaded: "2 hours ago" },
      { name: "trade_spend_ledger.xlsx", size: "3.1 MB", rows: "18,440", uploaded: "1 day ago" },
      { name: "baseline_demand_model.csv", size: "8.4 MB", rows: "96,480", uploaded: "3 days ago" },
    ],
    inputPreview: {
      headers: ["Campaign_ID", "Brand", "Mechanic", "Start_Date", "End_Date", "Spend_GBP", "Baseline", "Actual", "Incremental"],
      rows: [
        ["PRM-2841", "Tanqueray", "BOGOF", "2025-07-01", "2025-07-14", "£42,000", "8,200", "12,400", "4,200"],
        ["PRM-2842", "Smirnoff", "25% Off", "2025-07-15", "2025-07-28", "£68,000", "24,500", "34,800", "10,300"],
        ["PRM-2843", "Guinness", "Multibuy 3-for-2", "2025-08-01", "2025-08-21", "£54,000", "18,200", "26,100", "7,900"],
        ["PRM-2844", "Johnnie Walker", "Display Stand", "2025-09-01", "2025-09-30", "£38,000", "4,800", "8,600", "3,800"],
        ["PRM-2845", "Baileys", "Price Cut 15%", "2025-10-15", "2025-11-14", "£52,000", "12,400", "18,900", "6,500"],
        ["PRM-2846", "Captain Morgan", "BOGOF", "2025-11-01", "2025-11-14", "£28,000", "6,200", "8,800", "2,600"],
        ["PRM-2847", "Gordon's", "Display + Price Cut", "2025-12-01", "2025-12-24", "£86,000", "22,000", "38,400", "16,400"],
      ],
    },
    agentThoughts: {
      ingestiq: [
        { text: "Scanning 3 datasets: promo_campaigns_h2_2025.csv, trade_spend_ledger.xlsx, baseline_demand_model.csv", delay: 400 },
        { text: "Detected 34,260 promotional events + 18,440 spend entries + 96,480 baseline demand points.", delay: 1000 },
        { text: "Joining on Campaign_ID × SKU composite key... 97.4% match rate.", delay: 1400 },
        { text: "Validating date ranges — 8 overlapping promotional windows flagged for deduplication.", delay: 1200 },
        { text: "Reconciling spend ledger against campaign actuals... £2.4M total trade spend confirmed.", delay: 900 },
        { text: "✅ Data pipeline complete. Quality score: 98.6%. 149,180 joined records staged.", delay: 500 },
      ],
      marketiq: [
        { text: "Benchmarking portfolio ROI against category norms (industry avg: 1.8:1)...", delay: 1200 },
        { text: "Our portfolio average: 2.1:1 — above benchmark by +0.3.", delay: 800 },
        { text: "Segmenting by mechanic: BOGOF 1.4:1, Price Cut 2.6:1, Multibuy 2.2:1, Display 3.1:1.", delay: 2400 },
        { text: "Analysing cannibalisation effects — BOGOF campaigns show -8.2% impact on adjacent SKUs...", delay: 2800 },
        { text: "✅ Market benchmarking complete. Display is top performer; BOGOF underperforms with high cannibalisation.", delay: 500 },
      ],
      demandiq: [
        { text: "Isolating incremental lift from baseline using difference-in-differences methodology...", delay: 1800 },
        { text: "Controlling for seasonality, trend, and external factors across 34,260 promo events...", delay: 3200 },
        { text: "Gross incremental volume: 186,000 units. Estimating pull-forward effects...", delay: 2800 },
        { text: "Pull-forward analysis: 18% of incremental (33,480 units) is demand borrowed from post-promo weeks.", delay: 2200 },
        { text: "✅ Net incremental volume: 116,000 units after pull-forward adjustment. True baseline established.", delay: 600 },
      ],
      optimaiq: [
        { text: "Ingesting ROI benchmarks and net incremental analysis...", delay: 500 },
        { text: "Formulating trade spend reallocation: maximize net incremental units per £ of spend.", delay: 1400 },
        { text: "Current allocation: BOGOF 28%, Price Cut 24%, Multibuy 22%, Display 16%, Other 10%.", delay: 1000 },
        { text: "Identifying 8 underperforming campaigns with ROI < 1.0 (total waste: £180K)...", delay: 2600 },
        { text: "Solving reallocation optimization... shift 22% of budget from BOGOF → Display + Price Cut.", delay: 3800 },
        { text: "✅ Projected improvement: +18% net ROI, £420K incremental revenue. Strategy ready.", delay: 500 },
      ],
      visioniq: [
        { text: "Receiving promotional performance data from upstream agents...", delay: 350 },
        { text: "Generating ROI by promotion mechanic bar chart with benchmark overlay...", delay: 2200 },
        { text: "Creating incremental lift decomposition waterfall chart...", delay: 2600 },
        { text: "Producing monthly campaign performance timeline (Jul-Dec 2025)...", delay: 2000 },
        { text: "✅ 4 promotional analytics visualizations embedded in report.", delay: 400 },
      ],
    },
    motherHandoffs: {
      ingestiq: { text: "🧠 HarmonIQ routing task to IngestIQ — ingesting promotional campaign and spend data...", delay: 600 },
      marketiq: { text: "🧠 HarmonIQ delegating to MarketIQ — benchmarking ROI and segmenting by mechanic...", delay: 500 },
      demandiq: { text: "🧠 HarmonIQ calling DemandIQ — isolating true incremental lift from baseline demand...", delay: 700 },
      optimaiq: { text: "🧠 HarmonIQ invoking OptimaIQ — optimizing trade spend allocation for maximum ROI...", delay: 700 },
      visioniq: { text: "🧠 HarmonIQ handing off to VisionIQ — generating promotional analytics visualizations...", delay: 500 },
    },
    output: {
      summary: "Analysis of 34,260 promotional events across H2 2025 reveals a portfolio-average ROI of 2.1:1 against £2.4M in trade spend. After controlling for demand pull-forward effects, net incremental volume is 116,000 units. Display-led promotions deliver the highest ROI (3.1:1) while BOGOF campaigns underperform (1.4:1) with significant cannibalisation. Recommended budget reallocation of 22% from BOGOF to Display + Price Cut mechanics projects an 18% improvement in net ROI and £420K in incremental revenue.",
      metrics: [
        { label: "Portfolio ROI", value: "2.1:1", delta: "+0.3 vs category avg" },
        { label: "Net Incremental", value: "116K units", delta: "After pull-forward adj" },
        { label: "Best Mechanic", value: "Display 3.1:1", delta: "+48% vs portfolio avg" },
        { label: "Reallocation Savings", value: "£420K", delta: "+18% net ROI" },
      ],
      files: ["Promo_ROI_Analysis_H2.xlsx", "Trade_Spend_Optimization.pdf", "Campaign_Performance_Detail.csv", "ROI_Dashboard.html"],
    },
    hitlCheckpoints: {
      ingestiq: { title: "IngestIQ Complete", summary: "Data quality score: 98.6%. 149,180 joined records staged. £2.4M total trade spend confirmed.", recommendation: null },
      marketiq: { title: "MarketIQ Complete", summary: "Portfolio ROI: 2.1:1 (above 1.8:1 benchmark). Display is top performer (3.1:1). BOGOF underperforms (1.4:1).", recommendation: "BOGOF campaigns show -8.2% cannibalisation on adjacent SKUs. Consider phasing out BOGOF for premium brands." },
      demandiq: { title: "DemandIQ Complete", summary: "Net incremental volume: 116K units after pull-forward adjustment. 18% of gross lift is demand borrowing.", recommendation: null },
      optimaiq: { title: "OptimaIQ Complete", summary: "Reallocation: shift 22% budget from BOGOF → Display + Price Cut. Projected +18% net ROI improvement.", recommendation: null },
      visioniq: { title: "VisionIQ Complete", summary: "4 promotional analytics visualizations generated: ROI by mechanic, lift decomposition, campaign timeline, spend allocation.", recommendation: null },
    },
    constraintAlerts: [
      {
        triggeredBy: "marketiq",
        afterThought: 2,
        severity: "warning",
        title: "Mechanic ROI Below Breakeven",
        message: "BOGOF promotion mechanic shows ROI of 1.4:1 — while above breakeven (1.0), the 2 Captain Morgan BOGOF campaigns returned only 0.9:1, representing a net loss of £3,200.",
        constraint: "All mechanic ROI ≥ 1.0",
        suggestion: "Exclude Captain Morgan from future BOGOF campaigns. Recommend switching to Display Stand mechanic (projected ROI: 2.8:1 for this brand).",
        revisedThoughts: [
          { text: "🔄 Re-running MarketIQ with brand-level mechanic exclusions...", delay: 1200 },
          { text: "Excluding Captain Morgan from BOGOF analysis. Recalculating mechanic-level ROI...", delay: 2800 },
          { text: "Revised BOGOF ROI (excl. Captain Morgan): 1.6:1. Captain Morgan Display ROI: 2.8:1.", delay: 2200 },
          { text: "✅ Revised benchmarking complete. All brand×mechanic combinations now above 1.0 breakeven.", delay: 600 },
        ],
      },
      {
        triggeredBy: "demandiq",
        afterThought: 3,
        severity: "warning",
        title: "Pull-Forward Effect Exceeds Threshold",
        message: "Demand pull-forward accounts for 18% of gross incremental volume (33,480 units). Smirnoff 25% Off campaign shows 28% pull-forward — exceeding the 25% threshold.",
        constraint: "Pull-forward ≤ 25% of incremental",
        suggestion: "Reduce Smirnoff discount depth to 20% to lower pull-forward, or extend the promotional window by 1 week to smooth demand.",
        revisedThoughts: [
          { text: "🔄 Re-running DemandIQ with adjusted Smirnoff promotional parameters...", delay: 1200 },
          { text: "Modelling Smirnoff at 20% discount with extended 3-week window...", delay: 3200 },
          { text: "Revised pull-forward for Smirnoff: 21% (down from 28%). Net incremental maintained.", delay: 2200 },
          { text: "Portfolio pull-forward: 16% (down from 18%). All within 25% threshold.", delay: 1800 },
          { text: "✅ Revised incremental analysis complete. All campaigns within pull-forward constraint.", delay: 600 },
        ],
      },
    ],
  },
};

// ─── Sub-components ───

function HarmonIQLogo({ collapsed, variant = "sidebar" }) {
  // variant: "sidebar" (white on dark bg), "light" (dark purple on light bg), "large" (white on dark login bg)
  const brightPurple = "#7C3AED";
  const textColor = variant === "light" ? "#2D1554" : "#FFFFFF";
  const sizes = { sidebar: collapsed ? 0 : 19, light: 22, large: 52 };
  const sz = sizes[variant] || 19;

  if (variant === "large") {
    return (
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
        <span style={{ fontSize: sz, fontWeight: 800, letterSpacing: "-1.5px", fontFamily: "'DM Sans', sans-serif", color: "#FFFFFF" }}>harmon</span>
        <span style={{ fontSize: sz, fontWeight: 800, letterSpacing: "-1.5px", fontFamily: "'DM Sans', sans-serif", color: brightPurple }}>iq</span>
      </div>
    );
  }

  if (collapsed && variant === "sidebar") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", color: brightPurple }}>iq</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "baseline", padding: variant === "sidebar" ? "20px 20px" : "0", gap: 0 }}>
      <span style={{ fontSize: sz, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif", color: textColor }}>harmon</span>
      <span style={{ fontSize: sz, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "'DM Sans', sans-serif", color: brightPurple }}>iq</span>
    </div>
  );
}

function AgentBadge({ agent, small }) {
  const a = SUPER_AGENTS.find(x => x.id === agent);
  if (!a) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: a.color + "18", color: a.color, padding: small ? "2px 8px" : "4px 10px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span>{a.icon}</span> {a.name}
    </span>
  );
}

function InputDataPreview({ useCaseId }) {
  const [expanded, setExpanded] = useState(false);
  const data = USE_CASE_DATA[useCaseId];
  if (!data) return null;
  const { inputFiles, inputPreview } = data;
  return (
    <div style={{ border: "1px solid #E8E6F0", borderRadius: 12, overflow: "hidden", background: "#fff", marginBottom: 16 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", background: expanded ? "#F9F8FE" : "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>📊</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>Input Data Preview</div>
            <div style={{ fontSize: 12, color: "#888" }}>{inputFiles.length} files · {inputFiles.reduce((a, f) => a + parseInt(f.rows.replace(/,/g, "")), 0).toLocaleString()} total rows</div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #E8E6F0" }}>
          {/* File list */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
            {inputFiles.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#F0EDFF", borderRadius: 8, fontSize: 11 }}>
                <span>{f.name.endsWith(".csv") ? "📊" : f.name.endsWith(".xlsx") ? "📗" : "📁"}</span>
                <span style={{ fontWeight: 500, color: "#1A1A2E" }}>{f.name}</span>
                <span style={{ color: "#888" }}>{f.size} · {f.rows} rows</span>
              </div>
            ))}
          </div>
          {/* Data table */}
          <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #E8E6F0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr style={{ background: "#F0EDFF" }}>
                  {inputPreview.headers.map((h, i) => (
                    <th key={i} style={{ padding: "8px 12px", textAlign: "left", color: "#6C5CE7", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "2px solid #D0CEE0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inputPreview.rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : "#FAFAFE" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "6px 12px", borderBottom: "1px solid #F0F0F0", whiteSpace: "nowrap", color: "#333" }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 6, fontStyle: "italic" }}>Showing first {inputPreview.rows.length} rows · Full dataset will be processed by IngestIQ</div>
        </div>
      )}
    </div>
  );
}

function ConnectorIcon({ id, size = 22 }) {
  const s = size;
  switch (id) {
    case "local":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M3 7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" fill="#F39C12" stroke="#E67E22" strokeWidth="0.5"/>
          <path d="M3 7H21V9H3V7Z" fill="#E67E22" opacity="0.3"/>
        </svg>
      );
    case "database":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="6" rx="8" ry="3" fill="#3498DB"/>
          <path d="M4 6V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V6" stroke="#3498DB" strokeWidth="1.5" fill="none"/>
          <ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="#3498DB" strokeWidth="1" opacity="0.5"/>
          <ellipse cx="12" cy="18" rx="8" ry="3" fill="none" stroke="#3498DB" strokeWidth="1" opacity="0.3"/>
        </svg>
      );
    case "gdrive":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M8.627 2.5L2 14.5H8.186L14.813 2.5H8.627Z" fill="#0066DA"/>
          <path d="M14.813 2.5L8.186 14.5H2L8.627 2.5H14.813Z" fill="#00AC47" opacity="0.9"/>
          <path d="M14.813 2.5L21.44 14.5H15.254L8.627 2.5H14.813Z" fill="#EA4335" opacity="0.9"/>
          <path d="M2 14.5L5.093 20H18.907L22 14.5H15.254H8.186H2Z" fill="#00832D"/>
          <path d="M8.186 14.5H2L5.093 20H11.6L8.186 14.5Z" fill="#0066DA"/>
          <path d="M22 14.5H15.254L18.907 20H22L22 14.5Z" fill="#FFBA00" opacity="0"/>
          <path d="M15.254 14.5L11.6 20H18.907L22 14.5H15.254Z" fill="#FFBA00"/>
        </svg>
      );
    case "icloud":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="icloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5AC8FA"/>
              <stop offset="100%" stopColor="#007AFF"/>
            </linearGradient>
          </defs>
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="url(#icloudGrad)"/>
          <path d="M12 14.5V9M9.5 11.5L12 9L14.5 11.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "onedrive":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M14.5 17H6.5C3.46 17 1 14.54 1 11.5C1 8.86 2.88 6.66 5.38 6.12C6.27 3.74 8.54 2 11.24 2C13.28 2 15.08 3.04 16.14 4.62" fill="#0364B8"/>
          <path d="M9.5 8.5C10.3 7.57 11.48 7 12.8 7C14.54 7 16.04 8.08 16.66 9.6C16.88 9.54 17.12 9.5 17.36 9.5C19.38 9.5 21 11.12 21 13.14C21 15.16 19.38 16.78 17.36 16.78H10.26" fill="#0078D4"/>
          <path d="M6.5 17C3.46 17 1 14.54 1 11.5C1 9.16 2.48 7.18 4.56 6.38C4.16 7.04 3.94 7.8 3.94 8.62C3.94 11.22 6.04 13.32 8.64 13.32H16.66C17.26 13.32 17.82 13.18 18.32 12.94C18.12 15.18 16.24 16.96 13.94 16.96H6.5V17Z" fill="#1490DF"/>
          <path d="M21 13.14C21 15.16 19.38 16.78 17.36 16.78H10.26C8.14 16.78 6.42 15.06 6.42 12.94C6.42 10.82 8.14 9.1 10.26 9.1C10.76 9.1 11.22 9.2 11.66 9.38C12.44 8.24 13.76 7.5 15.26 7.5C17.66 7.5 19.6 9.44 19.6 11.84C19.6 12.02 19.58 12.18 19.56 12.36" fill="#28A8EA"/>
        </svg>
      );
    case "sharepoint":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="11" cy="9" r="7" fill="#036C70"/>
          <circle cx="15.5" cy="14" r="5.5" fill="#1A9BA1"/>
          <circle cx="10" cy="16.5" r="4.5" fill="#37C6D0"/>
          <path d="M4 9C4 5.13 7.13 2 11 2C14.87 2 18 5.13 18 9H11V16C7.13 16 4 12.87 4 9Z" fill="#036C70" opacity="0.15"/>
          <text x="8.5" y="11.5" fill="#fff" fontSize="7" fontWeight="800" fontFamily="'Segoe UI', sans-serif">S</text>
        </svg>
      );
    default:
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#DDD"/></svg>;
  }
}

function ConnectorRow({ connector, onToggle }) {
  const fileCount = connector.files ? connector.files.length : 0;
  const isConnected = connector.status === "connected";
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1px solid ${isConnected ? "#C6F6D5" : "#E8E6F0"}`, cursor: "pointer", background: isConnected ? "#F0FFF4" : "#fff", transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ConnectorIcon id={connector.id} size={22} />
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E" }}>{connector.name}</span>
          {isConnected && (fileCount > 0 || connector.tables) && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
              {fileCount > 0 ? `${fileCount} file${fileCount > 1 ? "s" : ""} attached` : `${connector.tables} tables · ${connector.db}`}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: isConnected ? "#00B894" : "#999", fontWeight: 600 }}>{isConnected ? "Connected" : "Not connected"}</span>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: isConnected ? "#00B894" : "#DDD" }} />
      </div>
    </div>
  );
}

function ConnectorsSection({ connectors, onToggle, onManage }) {
  const [expanded, setExpanded] = useState(false);
  const connectedCount = connectors.filter(c => c.status === "connected").length;
  const totalFiles = connectors.reduce((sum, c) => sum + (c.files ? c.files.length : 0), 0);
  return (
    <div style={{ border: "1px solid #E8E6F0", borderRadius: 12, overflow: "hidden", background: "#fff", marginBottom: 20 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", background: expanded ? "#F9F8FE" : "#fff", transition: "background 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔌</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>Connections</div>
            <div style={{ fontSize: 12, color: "#888" }}>{connectedCount} connected · {totalFiles} files attached</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {connectors.filter(c => c.status === "connected").slice(0, 4).map(c => (
              <div key={c.id} style={{ width: 24, height: 24, borderRadius: 6, background: "#F0EDFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ConnectorIcon id={c.id} size={14} />
              </div>
            ))}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: "1px solid #E8E6F0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 4px 4px" }}>
            <button onClick={(e) => { e.stopPropagation(); onManage(); }} style={{ fontSize: 12, color: "#6C5CE7", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Manage</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {connectors.map(c => <ConnectorRow key={c.id} connector={c} onToggle={() => onToggle(c.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectDataModal({ connectors, onToggle, onClose }) {
  const [expandedConn, setExpandedConn] = useState(null);
  const connectedCount = connectors.filter(c => c.status === "connected").length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, width: 580, maxHeight: "85vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 28px", borderBottom: "1px solid #EEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E" }}>🔌 Connect Your Data</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{connectedCount} of {connectors.length} sources connected</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ padding: "4px 12px", borderRadius: 20, background: "#F0FFF4", color: "#00B894", fontSize: 11, fontWeight: 600 }}>{connectedCount} active</div>
            <div onClick={onClose} style={{ cursor: "pointer", color: "#888", fontSize: 18 }}>✕</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 28px" }}>
          {connectors.map(c => {
            const isConn = c.status === "connected";
            const isExp = expandedConn === c.id;
            return (
              <div key={c.id} style={{ border: `1px solid ${isConn ? "#C6F6D5" : "#E8E6F0"}`, borderRadius: 14, marginBottom: 10, background: isConn ? "#FAFFFC" : "#fff", overflow: "hidden", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: isConn ? "pointer" : "default" }} onClick={() => isConn && setExpandedConn(isExp ? null : c.id)}>
                    <ConnectorIcon id={c.id} size={28} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                        {isConn ? (
                          c.files ? `${c.files.length} file${c.files.length > 1 ? "s" : ""} · Click to expand` :
                          c.tables ? `${c.tables} tables · ${c.host}` : "Connected"
                        ) : "Click Connect to set up"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isConn && (c.files || c.tables) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s", cursor: "pointer" }} onClick={() => setExpandedConn(isExp ? null : c.id)}><polyline points="6 9 12 15 18 9"/></svg>
                    )}
                    <button onClick={() => onToggle(c.id)} style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${isConn ? "#E74C3C" : "#00B894"}`, background: isConn ? "#FFF5F5" : "#F0FFF4", color: isConn ? "#E74C3C" : "#00B894", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {isConn ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                </div>
                {isExp && isConn && (
                  <div style={{ borderTop: "1px solid #E8E6F0", padding: "12px 18px", background: "#F9FEFA" }}>
                    {c.files && c.files.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#fff", borderRadius: 8, marginBottom: 4, border: "1px solid #EEE" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{f.name.endsWith(".csv") ? "📊" : f.name.endsWith(".xlsx") ? "📗" : f.name.includes("gsheet") ? "📊" : f.name.includes("gdoc") ? "📄" : "📁"}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "#1A1A2E" }}>{f.name}</div>
                            <div style={{ fontSize: 10, color: "#888" }}>{f.size}{f.rows ? ` · ${f.rows} rows` : ""}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: "#999" }}>{f.uploaded || f.synced}</div>
                      </div>
                    ))}
                    {c.tables && (
                      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #EEE", padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", marginBottom: 4 }}>Database: {c.db}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>Host: {c.host}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{c.tables} tables available · Last sync: {c.lastSync}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {["fact_sales", "dim_product", "dim_store", "fact_inventory", "dim_calendar", "fact_promotions"].map(t => (
                            <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#F0EDFF", color: "#6C5CE7", fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
                          ))}
                          <span style={{ fontSize: 10, padding: "3px 8px", color: "#999" }}>+{c.tables - 6} more</span>
                        </div>
                      </div>
                    )}
                    {c.site && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Site: {c.site}</div>
                    )}
                    {c.account && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Account: {c.account}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Upload area */}
          <div style={{ border: "2px dashed #D0CEE0", borderRadius: 14, padding: "28px 20px", textAlign: "center", marginTop: 8, cursor: "pointer", transition: "all 0.2s", background: "#FAFAFE" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Drag & drop files here</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>CSV, Excel, Parquet, JSON, PDF — up to 200MB</div>
          </div>
        </div>
        <div style={{ padding: "14px 28px 20px", borderTop: "1px solid #EEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#888" }}>IngestIQ will automatically parse & normalise connected data</div>
          <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, background: "#2D1B69", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function AgentBrainPanel({ thoughts, isRunning, activeAgents, connectors,
  hitlPaused, hitlCheckpoint, hitlAdjustMode, hitlAdjustText,
  onHitlApprove, onHitlStartAdjust, onHitlAdjustTextChange, onHitlAdjustSubmit,
  constraintPaused, constraintData, constraintInput,
  onConstraintInputChange, onConstraintApply, onConstraintSkip,
}) {
  const panelRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight;
  }, [thoughts]);

  useEffect(() => {
    if (isRunning) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const lastThought = thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;
  const currentAgentLabel = lastThought && lastThought.agent !== "HarmonIQ" ? lastThought.agent : null;

  // Color map for syntax-like highlighting in dark mode
  const syntaxColors = {
    keyword: "#C792EA",   // purple - for agent names
    string: "#C3E88D",    // green - for values/results
    number: "#F78C6C",    // orange - for metrics
    comment: "#546E7A",   // grey - for meta info
    fn: "#82AAFF",        // blue - for actions
    warn: "#FFCB6B",      // yellow - for warnings
    success: "#C3E88D",   // green
  };

  return (
    <div style={{ width: 420, minWidth: 420, background: "#1E1E2E", display: "flex", flexDirection: "column", height: "100%", borderLeft: "1px solid #2A2A3C" }}>
      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #2A2A3C" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🧠</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#E8E6F0" }}>Agent Brain</span>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: isRunning ? "#C3E88D" : "#546E7A", animation: isRunning ? "pulse 1.5s infinite" : "none", marginLeft: 2 }} />
          </div>
          {(isRunning || elapsed > 0) && (
            <span style={{ fontSize: 11, color: "#546E7A", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontWeight: 500, background: "#252536", padding: "2px 8px", borderRadius: 4 }}>{formatTime(elapsed)}</span>
          )}
        </div>
        {isRunning && currentAgentLabel && (
          <div style={{ fontSize: 11, color: syntaxColors.keyword, marginTop: 8, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: lastThought.color, animation: "pulse 1s infinite" }} />
            {currentAgentLabel} <span style={{ color: "#546E7A" }}>is processing...</span>
          </div>
        )}
        {isRunning && !currentAgentLabel && (
          <div style={{ fontSize: 11, color: syntaxColors.fn, marginTop: 8, fontWeight: 500, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
            ⚡ orchestrating agents...
          </div>
        )}
      </div>

      {/* Activity Label */}
      <div style={{ padding: "10px 18px 0", fontSize: 10, fontWeight: 600, color: "#546E7A", textTransform: "uppercase", letterSpacing: "1px" }}>
        Activity
      </div>

      {/* Thoughts stream */}
      <div ref={panelRef} style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {thoughts.length === 0 && !isRunning && (
          <div style={{ color: "#546E7A", fontSize: 12, textAlign: "center", marginTop: 50, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.8 }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>⚙️</div>
            <span style={{ color: "#C792EA" }}>await</span> workflow.run()<br/>
            <span style={{ color: "#546E7A" }}>// agent activity streams here</span>
          </div>
        )}
        {thoughts.map((t, i) => {
          const isHandoff = t.agent === "HarmonIQ";
          const isComplete = t.text.startsWith("✅");
          return (
            <div key={i} style={{ marginBottom: isHandoff ? 14 : 8, animation: "fadeIn 0.4s ease" }}>
              {isHandoff ? (
                <div style={{ padding: "10px 14px", background: "#252536", borderRadius: 8, borderLeft: "3px solid #C792EA", margin: "6px 0" }}>
                  <div style={{ fontSize: 12.5, color: "#C792EA", fontWeight: 600, lineHeight: 1.6, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                    <span style={{ color: "#FFCB6B" }}>→</span> {t.text.replace("🧠 ", "")}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 8px", borderRadius: 6, background: isComplete ? "#C3E88D10" : "transparent" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: isComplete ? syntaxColors.success : (t.color || "#82AAFF"), marginTop: 7, flexShrink: 0, boxShadow: isComplete ? `0 0 6px ${syntaxColors.success}44` : "none" }} />
                  <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: t.color || "#82AAFF", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9 }}>{t.agent}</div>
                    <div style={{ fontSize: 12, color: isComplete ? syntaxColors.success : "#B8B5C8", lineHeight: 1.6, wordBreak: "break-word" }}>
                      {t.text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {/* HITL Checkpoint Card */}
        {hitlPaused && hitlCheckpoint && (
          <div style={{ margin: "8px 4px", padding: "14px", background: "#2A2A3C", borderRadius: 10, borderLeft: "4px solid #FFCB6B", animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>🔍</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#FFCB6B", fontFamily: "'JetBrains Mono', monospace" }}>HITL Checkpoint — {hitlCheckpoint.title}</span>
            </div>
            <div style={{ fontSize: 12, color: "#B8B5C8", lineHeight: 1.6, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>{hitlCheckpoint.summary}</div>
            {hitlCheckpoint.recommendation && (
              <div style={{ fontSize: 12, color: "#C3E88D", fontStyle: "italic", marginBottom: 10, padding: "6px 10px", background: "#C3E88D10", borderRadius: 6, lineHeight: 1.5 }}>
                💡 {hitlCheckpoint.recommendation}
              </div>
            )}
            {hitlAdjustMode ? (
              <div>
                <textarea
                  value={hitlAdjustText}
                  onChange={e => onHitlAdjustTextChange(e.target.value)}
                  placeholder="Type your adjustment note..."
                  style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 8, border: "1px solid #3A3A4C", background: "#1E1E2E", color: "#E8E6F0", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", resize: "vertical", outline: "none", marginBottom: 8 }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={onHitlAdjustSubmit} style={{ padding: "6px 14px", borderRadius: 6, background: "#7C3AED", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Submit Adjustment</button>
                  <button onClick={() => { onHitlAdjustTextChange(""); onHitlApprove(); }} style={{ padding: "6px 14px", borderRadius: 6, background: "transparent", color: "#546E7A", border: "1px solid #3A3A4C", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={onHitlApprove} style={{ padding: "7px 14px", borderRadius: 6, background: "#00B894", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Approve & Continue</button>
                <button onClick={onHitlStartAdjust} style={{ padding: "7px 14px", borderRadius: 6, background: "transparent", color: "#C792EA", border: "1px solid #C792EA40", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Adjust</button>
              </div>
            )}
          </div>
        )}

        {/* Constraint Violation Card */}
        {constraintPaused && constraintData && (
          <div style={{ margin: "8px 4px", padding: "14px", background: "#2A2A3C", borderRadius: 10, borderLeft: "4px solid #E74C3C", animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#E74C3C", fontFamily: "'JetBrains Mono', monospace" }}>Constraint Violated: {constraintData.title}</span>
            </div>
            <div style={{ fontSize: 12, color: "#B8B5C8", lineHeight: 1.6, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{constraintData.message}</div>
            <div style={{ fontSize: 11, color: "#F78C6C", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", padding: "4px 8px", background: "#F78C6C10", borderRadius: 4, display: "inline-block" }}>
              Constraint: <span style={{ textDecoration: "line-through" }}>{constraintData.constraint}</span>
            </div>
            {constraintData.suggestion && (
              <div style={{ fontSize: 12, color: "#C3E88D", fontStyle: "italic", marginBottom: 10, padding: "6px 10px", background: "#C3E88D10", borderRadius: 6, lineHeight: 1.5 }}>
                💡 Suggestion: {constraintData.suggestion}
              </div>
            )}
            <textarea
              value={constraintInput}
              onChange={e => onConstraintInputChange(e.target.value)}
              placeholder="Type your adjustment (or leave blank to use suggestion)..."
              style={{ width: "100%", minHeight: 50, padding: 10, borderRadius: 8, border: "1px solid #3A3A4C", background: "#1E1E2E", color: "#E8E6F0", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", resize: "vertical", outline: "none", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onConstraintApply} style={{ padding: "7px 14px", borderRadius: 6, background: "#00B894", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🔄 Apply & Re-run from {constraintData.agentName}</button>
              <button onClick={onConstraintSkip} style={{ padding: "7px 14px", borderRadius: 6, background: "transparent", color: "#546E7A", border: "1px solid #3A3A4C", fontSize: 12, cursor: "pointer" }}>⏭ Skip</button>
            </div>
          </div>
        )}

        {isRunning && !hitlPaused && !constraintPaused && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 8px" }}>
            <div className="thinking-dots-dark">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Connections section at bottom */}
      <div style={{ borderTop: "1px solid #2A2A3C" }}>
        {activeAgents && activeAgents.length > 0 && (
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #2A2A3C" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#546E7A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>Agents Used · {activeAgents.length}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {activeAgents.map(a => {
                const ag = SUPER_AGENTS.find(x => x.id === a);
                return ag ? (
                  <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: ag.color + "20", color: ag.color, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                    {ag.icon} {ag.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
        <div style={{ padding: "10px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#546E7A", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>Connections · {connectors ? connectors.filter(c => c.status === "connected").length : 0}</div>
          {(connectors || []).filter(c => c.status === "connected").map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, background: "#252536", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ConnectorIcon id={c.id} size={16} />
                <div>
                  <span style={{ fontSize: 11.5, color: "#B8B5C8", fontWeight: 500 }}>{c.name}</span>
                  <div style={{ fontSize: 9, color: "#546E7A" }}>
                    {c.files ? `${c.files.length} file${c.files.length > 1 ? "s" : ""}` : c.tables ? `${c.tables} tables` : "Active"}
                  </div>
                </div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00B894" }} />
            </div>
          ))}
          {(connectors || []).filter(c => c.status === "connected").length === 0 && (
            <div style={{ fontSize: 11, color: "#546E7A", fontStyle: "italic", padding: "4px 10px" }}>No sources connected</div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationBell({ notifications, onClick }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div onClick={onClick} style={{ position: "relative", cursor: "pointer", padding: 6 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      {unread > 0 && (
        <div style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, background: "#E74C3C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{unread}</div>
      )}
    </div>
  );
}

function ShareModal({ onClose }) {
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [sharedList, setSharedList] = useState(COLLABORATORS.slice(0, 3));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 460, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #EEE" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Share & Collaborate</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Manage who can access this workflow</div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Add email address..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #DDD", fontSize: 13, outline: "none" }} />
            <select value={shareRole} onChange={e => setShareRole(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #DDD", fontSize: 13, background: "#fff" }}>
              <option>Viewer</option>
              <option>Editor</option>
              <option>Manager</option>
            </select>
            <button onClick={() => { if (shareEmail) { setSharedList(prev => [...prev, { id: "new", name: shareEmail.split("@")[0], email: shareEmail, avatar: shareEmail.slice(0, 2).toUpperCase(), role: shareRole }]); setShareEmail(""); } }} style={{ padding: "10px 16px", borderRadius: 10, background: "#2D1B69", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add</button>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.5px" }}>People with access</div>
          {sharedList.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F5F5F5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6C5CE7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{u.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{u.email}</div>
                </div>
              </div>
              <select defaultValue={u.role} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #DDD", fontSize: 12, background: "#fff" }}>
                <option>Viewer</option>
                <option>Editor</option>
                <option>Manager</option>
                <option>Owner</option>
              </select>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #DDD", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, background: "#2D1B69", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ onClose, onSave, templateName }) {
  const [freq, setFreq] = useState("weekly");
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("08:00");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #EEE" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Schedule Trigger</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{templateName}</div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Frequency</label>
            <select value={freq} onChange={e => setFreq(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #DDD", fontSize: 13 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {freq !== "daily" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Day</label>
              <select value={day} onChange={e => setDay(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #DDD", fontSize: 13 }}>
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #DDD", fontSize: 13 }} />
          </div>
        </div>
        <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #DDD", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave?.({ freq, day, time }); onClose(); }} style={{ padding: "10px 20px", borderRadius: 10, background: "#2D1B69", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Schedule</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function HarmonIQApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState("");
  const [showConnectData, setShowConnectData] = useState(false);

  // Home state
  const [userPrompt, setUserPrompt] = useState("");
  const [workflowCreated, setWorkflowCreated] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState({});
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runComplete, setRunComplete] = useState(false);
  const [agentThoughts, setAgentThoughts] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [connectors, setConnectors] = useState(CONNECTORS);
  const [showAgentBrain, setShowAgentBrain] = useState(true);
  const [selectedWorkflowAgents, setSelectedWorkflowAgents] = useState([]);

  // Active use case tracking (for per-use-case data)
  const [activeUseCaseId, setActiveUseCaseId] = useState(null);
  const activeUseCaseIdRef = useRef(null);
  useEffect(() => { activeUseCaseIdRef.current = activeUseCaseId; }, [activeUseCaseId]);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateEditMode, setTemplateEditMode] = useState(false);

  // Trigger state
  const [triggers, setTriggers] = useState(SAMPLE_TRIGGERS);

  // Relic state
  const [relics] = useState(SAMPLE_RELICS);

  // Canvas state
  const [canvasSelectedUseCase, setCanvasSelectedUseCase] = useState(null);

  // Progressive workflow step: 0=not started, 1=plan shown, 2=data shown, 3=agents shown, 4=running/complete
  const [workflowStep, setWorkflowStep] = useState(0);

  // HITL checkpoint state
  const [hitlPaused, setHitlPaused] = useState(false);
  const [hitlCheckpoint, setHitlCheckpoint] = useState(null);
  const [hitlAdjustMode, setHitlAdjustMode] = useState(false);
  const [hitlAdjustText, setHitlAdjustText] = useState("");

  // Constraint violation state
  const [constraintPaused, setConstraintPaused] = useState(false);
  const [constraintData, setConstraintData] = useState(null);
  const [constraintInput, setConstraintInput] = useState("");

  // Refs for resume callbacks (stored as refs to avoid stale closures)
  const hitlResumeRef = useRef(null);
  const constraintResumeRef = useRef(null);
  const timelineRef = useRef([]);
  const timelineIndexRef = useRef(0);
  const mainContentRef = useRef(null);

  // Auto-scroll main content area to bottom when workflow progresses or results appear
  useEffect(() => {
    if (mainContentRef.current && workflowStep > 0) {
      setTimeout(() => {
        if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: mainContentRef.current.scrollHeight, behavior: "smooth" });
        }
      }, 100);
    }
  }, [workflowStep, runComplete]);

  const resetHome = useCallback(() => {
    if (runWorkflowRef.current) clearTimeout(runWorkflowRef.current);
    setUserPrompt("");
    setWorkflowCreated(false);
    setAgentInstructions({});
    setExpandedAgent(null);
    setIsRunning(false);
    setRunComplete(false);
    setAgentThoughts([]);
    setActiveAgents([]);
    setSelectedWorkflowAgents([]);
    setActiveUseCaseId(null);
    setWorkflowStep(0);
    setHitlPaused(false);
    setHitlCheckpoint(null);
    setHitlAdjustMode(false);
    setHitlAdjustText("");
    setConstraintPaused(false);
    setConstraintData(null);
    setConstraintInput("");
    hitlResumeRef.current = null;
    constraintResumeRef.current = null;
    timelineRef.current = [];
    timelineIndexRef.current = 0;
  }, []);

  const createWorkflow = useCallback(() => {
    if (!userPrompt.trim()) return;
    // Try to match prompt to a template for realistic data
    const prompt = userPrompt.toLowerCase();
    let matchedId = "t1"; // default
    if (prompt.includes("stock") || prompt.includes("oos") || prompt.includes("replenish")) matchedId = "t1";
    else if (prompt.includes("gap") || prompt.includes("target") || prompt.includes("sales gap")) matchedId = "t2";
    else if (prompt.includes("competitor") || prompt.includes("price monitor") || prompt.includes("pricing")) matchedId = "t3";
    else if (prompt.includes("forecast") || prompt.includes("demand") || prompt.includes("digest")) matchedId = "t4";
    else if (prompt.includes("shelf") || prompt.includes("compliance") || prompt.includes("planogram") || prompt.includes("image")) matchedId = "t5";
    else if (prompt.includes("promo") || prompt.includes("roi") || prompt.includes("campaign") || prompt.includes("trade spend")) matchedId = "t6";
    const template = SAMPLE_TEMPLATES.find(t => t.id === matchedId);
    const agents = template ? template.agents : ["ingestiq", "demandiq", "marketiq", "optimaiq", "visioniq"];
    const instructionMap = {
      ingestiq: "Parse and normalize all uploaded data files. Detect schema, impute missing values, and prepare clean datasets for analysis.",
      visioniq: "Generate visual analytics including time-series charts, comparison visualizations, and heatmaps for the final report.",
      visioniq_plus: "Process images and documents using vision transformers. Extract tabular data, detect product facings, and compute compliance metrics.",
      marketiq: "Analyze competitor pricing signals, market share trends, and category growth rates. Flag competitive risks.",
      demandiq: "Build ensemble demand forecast using historical sales. Generate projections with confidence intervals.",
      optimaiq: "Formulate multi-objective optimization balancing revenue maximization, risk reduction, and margin preservation.",
    };
    const instructions = {};
    agents.forEach(a => { instructions[a] = instructionMap[a] || ""; });
    setActiveUseCaseId(matchedId);
    setSelectedWorkflowAgents(agents);
    setAgentInstructions(instructions);
    setWorkflowCreated(true);
    setWorkflowStep(1);
  }, [userPrompt]);

  const runWorkflowRef = useRef(null);

  const runWorkflow = useCallback(() => {
    setWorkflowStep(4);
    setIsRunning(true);
    setRunComplete(false);
    setAgentThoughts([]);
    setActiveAgents([]);
    setHitlPaused(false);
    setHitlCheckpoint(null);
    setConstraintPaused(false);
    setConstraintData(null);
    setConstraintInput("");

    // Use per-use-case data if available, otherwise fall back to defaults
    const currentUcId = activeUseCaseIdRef.current || activeUseCaseId;
    const ucData = currentUcId ? USE_CASE_DATA[currentUcId] : null;
    const agentThoughtsSource = ucData?.agentThoughts || SIMULATED_AGENT_THOUGHTS;
    const handoffsSource = ucData?.motherHandoffs || MOTHER_AGENT_HANDOFFS;
    const hitlCheckpointsData = ucData?.hitlCheckpoints || {};
    const constraintAlertsData = ucData?.constraintAlerts || [];

    // Build the full timeline with HITL checkpoints and constraint alerts
    const agentOrder = selectedWorkflowAgents.length > 0 ? selectedWorkflowAgents : ["ingestiq", "demandiq", "marketiq", "optimaiq", "visioniq"];
    const timeline = [];

    agentOrder.forEach((agentId) => {
      const agent = SUPER_AGENTS.find(a => a.id === agentId);
      // Mother agent handoff
      const handoff = handoffsSource[agentId];
      if (handoff) {
        timeline.push({ type: "thought", agent: "HarmonIQ", text: handoff.text, color: "#2D1B69", delay: handoff.delay, agentId: null });
      }
      // Agent's own thoughts with constraint alerts injected at right positions
      const thoughts = agentThoughtsSource[agentId] || [];
      const alertsForAgent = constraintAlertsData.filter(a => a.triggeredBy === agentId);

      thoughts.forEach((t, tIdx) => {
        const jitter = 1 + (Math.random() * 0.6 - 0.3);
        timeline.push({ type: "thought", agent: agent.name, text: t.text, color: agent.color, delay: Math.round(t.delay * jitter), agentId });

        // Check if any constraint alert fires after this thought index
        alertsForAgent.forEach(alert => {
          if (alert.afterThought === tIdx) {
            timeline.push({ type: "constraint_alert", ...alert, agentName: agent.name, agentColor: agent.color, agentId });
          }
        });
      });

      // Insert HITL checkpoint after each agent's last thought
      if (hitlCheckpointsData[agentId]) {
        timeline.push({ type: "hitl_checkpoint", ...hitlCheckpointsData[agentId], agentId, agentName: agent.name, agentColor: agent.color });
      }
    });

    timelineRef.current = timeline;
    timelineIndexRef.current = 0;

    // Step function that processes timeline entries
    const step = () => {
      const tl = timelineRef.current;
      const idx = timelineIndexRef.current;

      if (idx < tl.length) {
        const entry = tl[idx];

        if (entry.type === "hitl_checkpoint") {
          // Pause for HITL approval
          setHitlPaused(true);
          setHitlCheckpoint(entry);
          timelineIndexRef.current = idx + 1;
          hitlResumeRef.current = step;
          return; // Stop — user must click approve
        }

        if (entry.type === "constraint_alert") {
          // Pause for constraint violation
          setConstraintPaused(true);
          setConstraintData(entry);
          setConstraintInput("");
          timelineIndexRef.current = idx + 1;
          constraintResumeRef.current = step;
          return; // Stop — user must act
        }

        // Normal thought entry
        setAgentThoughts(prev => [...prev, { agent: entry.agent, text: entry.text, color: entry.color }]);
        if (entry.agentId) {
          setActiveAgents(prev => prev.includes(entry.agentId) ? prev : [...prev, entry.agentId]);
        }
        timelineIndexRef.current = idx + 1;
        const nextIdx = timelineIndexRef.current;
        const nextDelay = nextIdx < tl.length ? (tl[nextIdx].delay || 500) : 500;
        runWorkflowRef.current = setTimeout(step, nextDelay);
      } else {
        setIsRunning(false);
        setRunComplete(true);
        setAgentThoughts(prev => [...prev, { agent: "HarmonIQ", text: "✅ Workflow complete. All agents have finished processing. Output report ready for download.", color: "#2D1B69" }]);
      }
    };
    // Kick off with the first entry's delay
    runWorkflowRef.current = setTimeout(step, timeline[0]?.delay || 500);
  }, [selectedWorkflowAgents, activeUseCaseId]);

  // HITL: Approve & Continue
  const handleHitlApprove = useCallback(() => {
    const checkpoint = hitlCheckpoint;
    setHitlPaused(false);
    setHitlCheckpoint(null);
    setHitlAdjustMode(false);
    setHitlAdjustText("");
    setAgentThoughts(prev => [...prev, { agent: "HarmonIQ", text: `✓ User approved ${checkpoint?.agentName || "agent"} output. Continuing...`, color: "#2D1B69" }]);
    if (hitlResumeRef.current) {
      const resume = hitlResumeRef.current;
      hitlResumeRef.current = null;
      runWorkflowRef.current = setTimeout(resume, 600);
    }
  }, [hitlCheckpoint]);

  // HITL: Submit adjustment then continue
  const handleHitlAdjust = useCallback(() => {
    const checkpoint = hitlCheckpoint;
    const note = hitlAdjustText.trim() || "No specific adjustment noted.";
    setHitlPaused(false);
    setHitlCheckpoint(null);
    setHitlAdjustMode(false);
    setHitlAdjustText("");
    setAgentThoughts(prev => [...prev, { agent: "HarmonIQ", text: `📝 User adjustment for ${checkpoint?.agentName || "agent"}: ${note}. Acknowledged by HarmonIQ.`, color: "#2D1B69" }]);
    if (hitlResumeRef.current) {
      const resume = hitlResumeRef.current;
      hitlResumeRef.current = null;
      runWorkflowRef.current = setTimeout(resume, 600);
    }
  }, [hitlCheckpoint, hitlAdjustText]);

  // Constraint: Apply & Re-run
  const handleConstraintApply = useCallback(() => {
    const alert = constraintData;
    const userInput = constraintInput.trim() || alert?.suggestion || "Applied suggested fix.";
    setConstraintPaused(false);
    setConstraintData(null);
    setConstraintInput("");
    setAgentThoughts(prev => [...prev, { agent: "HarmonIQ", text: `📝 User adjustment applied: ${userInput}`, color: "#2D1B69" }]);

    // Inject revised thoughts into the timeline at the current position
    if (alert?.revisedThoughts && alert.revisedThoughts.length > 0) {
      const tl = timelineRef.current;
      const idx = timelineIndexRef.current;
      const agentObj = SUPER_AGENTS.find(a => a.id === alert.agentId);
      const revisedEntries = alert.revisedThoughts.map(rt => ({
        type: "thought", agent: agentObj?.name || alert.agentName, text: rt.text,
        color: agentObj?.color || alert.agentColor, delay: rt.delay, agentId: alert.agentId,
      }));
      // Remove remaining thoughts for this agent (up to next handoff/checkpoint/different agent)
      let removeUntil = idx;
      while (removeUntil < tl.length && tl[removeUntil].agentId === alert.agentId && tl[removeUntil].type === "thought") {
        removeUntil++;
      }
      // Also remove the HITL checkpoint for this agent if it's next
      if (removeUntil < tl.length && tl[removeUntil].type === "hitl_checkpoint" && tl[removeUntil].agentId === alert.agentId) {
        removeUntil++;
      }
      tl.splice(idx, removeUntil - idx, ...revisedEntries);
      timelineRef.current = tl;
    }

    if (constraintResumeRef.current) {
      const resume = constraintResumeRef.current;
      constraintResumeRef.current = null;
      runWorkflowRef.current = setTimeout(resume, 800);
    }
  }, [constraintData, constraintInput]);

  // Constraint: Skip
  const handleConstraintSkip = useCallback(() => {
    setConstraintPaused(false);
    setConstraintData(null);
    setConstraintInput("");
    setAgentThoughts(prev => [...prev, { agent: "HarmonIQ", text: "⏭ User acknowledged constraint violation. Continuing as-is.", color: "#2D1B69" }]);
    if (constraintResumeRef.current) {
      const resume = constraintResumeRef.current;
      constraintResumeRef.current = null;
      runWorkflowRef.current = setTimeout(resume, 600);
    }
  }, []);

  // Cleanup timeouts on unmount or reset
  useEffect(() => {
    return () => { if (runWorkflowRef.current) clearTimeout(runWorkflowRef.current); };
  }, []);

  const handleSaveAsTemplate = () => {
    setNotifications(prev => [{ id: "n_new_" + Date.now(), type: "success", msg: "Workflow saved as template successfully!", time: "Just now", read: false }, ...prev]);
  };

  const toggleConnector = (id) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "connected" ? "disconnected" : "connected" } : c));
  };

  const NAV_ITEMS = [
    { id: "home", label: "Home", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "templates", label: "Templates", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { id: "triggers", label: "Triggers", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { id: "relics", label: "Relics", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { id: "canvas", label: "Canvas", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
    { id: "collaboration", label: "Collaboration", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "docs", label: "Documentation", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  ];

  // ─── Page Renderers ───

  const STEP_LABELS = ["Plan Review", "Connect Data", "Configure Agents", "Execute"];

  const renderStepIndicator = () => {
    if (workflowStep < 1) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "16px 20px 8px", animation: "fadeIn 0.4s ease" }}>
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isComplete = workflowStep > stepNum;
          const isCurrent = workflowStep === stepNum;
          const isFuture = workflowStep < stepNum;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, transition: "all 0.3s",
                  background: isComplete ? "#7C3AED" : isCurrent ? "#7C3AED" : "#E8E6F0",
                  color: isComplete || isCurrent ? "#fff" : "#999",
                  border: isCurrent ? "2px solid #C4B5FD" : "2px solid transparent",
                  boxShadow: isCurrent ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
                }}>
                  {isComplete ? "✓" : stepNum}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isComplete || isCurrent ? "#7C3AED" : "#999", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div style={{ width: 48, height: 2, background: isComplete ? "#7C3AED" : "#E8E6F0", margin: "0 6px", marginBottom: 18, transition: "background 0.3s" }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHome = () => (
    <div style={{ display: "flex", flex: 1, height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>{workflowCreated ? "Workflow Builder" : "What can I help you with?"}</div>
            {!workflowCreated && <div style={{ fontSize: 14, color: "#888", marginTop: 2 }}>Let's align your goal with HarmonIQ better</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {workflowCreated && <button onClick={() => setShowShareModal(true)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>🔗 Share</button>}
            <button onClick={() => setShowAgentBrain(!showAgentBrain)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: showAgentBrain ? "#F0EDFF" : "#fff", fontSize: 12, cursor: "pointer" }}>🧠 Agent Brain</button>
          </div>
        </div>

        {/* Step Progress Indicator */}
        {renderStepIndicator()}

        {/* Constraint violation banner */}
        {constraintPaused && constraintData && (
          <div style={{ margin: "0 28px", padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg, #FFF3CD, #FFF8E1)", border: "1px solid #FFE082", display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.4s ease" }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E65100" }}>Constraint violated: {constraintData.title}</div>
              <div style={{ fontSize: 11, color: "#BF360C" }}>Agent paused, awaiting your input</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF9800", animation: "pulse 1.5s infinite" }} />
          </div>
        )}

        <div ref={mainContentRef} style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {!workflowCreated ? (
            <div style={{ maxWidth: 680, margin: "50px auto", textAlign: "left" }}>
              {/* Mother Agent greeting — conversational */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #2D1554)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🧠</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>HarmonIQ Orchestrator</div>
                  <div style={{ background: "#F9F8FE", borderRadius: "4px 16px 16px 16px", padding: "18px 22px", border: "1px solid #E8E6F0" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E", marginBottom: 8, animation: "fadeIn 0.5s ease" }}>Hello! 👋</div>
                    <div style={{ fontSize: 15, color: "#555", lineHeight: 1.7, animation: "fadeIn 0.5s ease 0.15s both" }}>
                      How are you doing today? I coordinate <span style={{ color: "#7C3AED", fontWeight: 600 }}>six specialised Super Agents</span> behind the scenes — from data ingestion to optimisation — so you can focus on the decision, not the pipeline.
                    </div>
                    <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginTop: 10, animation: "fadeIn 0.5s ease 0.3s both" }}>
                      Tell me what you're working on and I'll break it into an execution plan, wire up the right data sources, and run the agents end-to-end. Let's go. ✨
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick action chips */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40, animation: "fadeIn 0.5s ease 0.45s both" }}>
                {[
                  { icon: "📁", label: "Connect Data", onClick: () => setShowConnectData(true) },
                  { icon: "📊", label: "Use Template", onClick: () => setPage("templates") },
                ].map(b => (
                  <button key={b.label} onClick={b.onClick} style={{ padding: "10px 22px", borderRadius: 12, border: "1px solid #E0DFF0", background: "#FAFAFE", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "#444", transition: "all 0.2s" }} onMouseEnter={e => e.target.style.background = "#F0EDFF"} onMouseLeave={e => e.target.style.background = "#FAFAFE"}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* User prompt display — always visible */}
              <div style={{ background: "#F9F8FE", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid #E8E6F0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6C5CE7", marginBottom: 4 }}>YOUR REQUEST</div>
                <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>{userPrompt}</div>
              </div>

              {/* ═══ STEP 1: Plan Review ═══ */}
              {workflowStep >= 1 && (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>📋 Goal Decomposition</div>
                    <div style={{ fontSize: 13.5, color: "#555", marginBottom: 12, paddingLeft: 20, lineHeight: 1.6 }}>Mother Agent has decomposed your request into the following execution plan. Each task is assigned to a specialised Super Agent.</div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>🔧 Execution Plan</div>
                    <div style={{ paddingLeft: 20, marginBottom: 12 }}>
                      {[
                        "Ingest and normalise uploaded sales data, inventory snapshots, and linked data sources",
                        "Generate 13-week ensemble demand forecast at SKU × location granularity",
                        "Pull competitive pricing signals and market share benchmarks for the category",
                        "Formulate multi-objective optimisation: maximise units subject to margin ≥ 15% and budget constraints",
                        "Produce visual analytics — time-series decomposition, heatmap of at-risk SKUs, scenario comparison chart",
                      ].map((t, i) => (
                        <div key={i} style={{ fontSize: 13.5, color: "#555", marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ color: "#6C5CE7", fontWeight: 600 }}>•</span> {t}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: "#6C5CE7", marginBottom: 8 }}>✅ Success Criteria</div>
                    <div style={{ paddingLeft: 20, marginBottom: 12 }}>
                      {["Projected units ≥ 400,000 target", "Blended margin ≥ 15%", "At-risk SKU count reduced by ≥ 50%", "Generate downloadable recommendation report with executive summary"].map((s, i) => (
                        <div key={i} style={{ fontSize: 13.5, color: "#555", marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ color: "#00B894" }}>✓</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: Connect Data ═══ */}
              {workflowStep >= 2 && (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  {/* Input Data Preview */}
                  {activeUseCaseId && <InputDataPreview useCaseId={activeUseCaseId} />}

                  {/* Connectors */}
                  <ConnectorsSection connectors={connectors} onToggle={toggleConnector} onManage={() => setShowConnectData(true)} />
                </div>
              )}

              {/* ═══ STEP 3: Configure Agents ═══ */}
              {workflowStep >= 3 && (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>🤖 Super Agent Workflow</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {selectedWorkflowAgents.map((agentId, idx) => {
                      const agent = SUPER_AGENTS.find(a => a.id === agentId);
                      const isExpanded = expandedAgent === agentId;
                      return (
                        <div key={agentId} style={{ border: "1px solid #E8E6F0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                          <div onClick={() => setExpandedAgent(isExpanded ? null : agentId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", background: isExpanded ? agent.color + "08" : "#fff" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 24, height: 24, background: agent.color + "20", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{agent.icon}</div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>
                                  <span style={{ fontSize: 12, color: "#999", marginRight: 6 }}>Step {idx + 1}</span>
                                  {agent.name}
                                </div>
                                <div style={{ fontSize: 12, color: "#888" }}>{agent.desc}</div>
                              </div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                          {isExpanded && (
                            <div style={{ padding: "12px 16px", borderTop: "1px solid #E8E6F0", background: "#FAFAFE" }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 6 }}>Agent Instructions (editable — HITL)</div>
                              <textarea
                                value={agentInstructions[agentId] || ""}
                                onChange={e => setAgentInstructions(prev => ({ ...prev, [agentId]: e.target.value }))}
                                style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: "1px solid #DDD", fontSize: 12, lineHeight: 1.6, resize: "vertical", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                              />
                              <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>You can modify these instructions to guide how {agent.name} processes your data.</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ STEP 4: Execute / Output ═══ */}
              {workflowStep >= 4 && runComplete && (() => {
                const outputData = (activeUseCaseId && USE_CASE_DATA[activeUseCaseId]?.output) || SIMULATED_OUTPUT;
                return (
                  <div style={{ background: "#F0FFF4", border: "1px solid #C6F6D5", borderRadius: 12, padding: "18px 20px", marginBottom: 20, animation: "fadeIn 0.4s ease" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>📋 Solution</div>
                    <div style={{ fontSize: 14, color: "#333", lineHeight: 1.7, marginBottom: 14 }}>{outputData.summary}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {outputData.metrics.map(m => (
                        <div key={m.label} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #E8E6F0" }}>
                          <div style={{ fontSize: 12, color: "#888" }}>{m.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>{m.value}</div>
                          <div style={{ fontSize: 12, color: m.delta.startsWith("+") ? "#00B894" : m.delta.startsWith("-") ? "#E74C3C" : "#888", fontWeight: 600 }}>{m.delta}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Output Files</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      {outputData.files.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 13, cursor: "pointer" }}>
                          📄 {f} <span style={{ color: "#6C5CE7", fontWeight: 600 }}>↓</span>
                        </div>
                      ))}
                    </div>
                    {activeUseCaseId && CANVAS_REPORTS[activeUseCaseId] && (
                      <button onClick={() => { setCanvasSelectedUseCase(activeUseCaseId); setPage("canvas"); }} style={{ padding: "10px 18px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #2D1554)", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        🖼 View Full Canvas Report
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Bottom Input / Action Bar */}
        <div style={{ padding: "14px 28px", borderTop: "1px solid #E8E6F0", background: "#fff" }}>
          {!workflowCreated ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createWorkflow()}
                placeholder="What analysis are you looking for?"
                style={{ flex: 1, padding: "14px 18px", borderRadius: 12, border: "1px solid #DDD", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
              />
              <button onClick={createWorkflow} disabled={!userPrompt.trim()} style={{ padding: "14px 28px", borderRadius: 12, background: userPrompt.trim() ? "#2D1B69" : "#CCC", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: userPrompt.trim() ? "pointer" : "not-allowed", transition: "background 0.2s" }}>Send</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={resetHome} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #DDD", background: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>+ New</button>
                <button onClick={resetHome} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #DDD", background: "#fff", fontSize: 12, cursor: "pointer" }}>🔄 Reset</button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Step 1: Approve plan */}
                {workflowStep === 1 && (
                  <>
                    <button onClick={() => setWorkflowStep(2)} style={{ padding: "10px 22px", borderRadius: 10, background: "#7C3AED", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>✓ Looks Good, Next</button>
                    <button onClick={() => { resetHome(); }} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #DDD", background: "#fff", fontSize: 13, cursor: "pointer", color: "#666" }}>✏️ Revise Plan</button>
                  </>
                )}
                {/* Step 2: Data ready */}
                {workflowStep === 2 && (
                  <button onClick={() => setWorkflowStep(3)} style={{ padding: "10px 22px", borderRadius: 10, background: "#7C3AED", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>✓ Data Ready, Next</button>
                )}
                {/* Step 3: Approve & Run */}
                {workflowStep === 3 && (
                  <button onClick={runWorkflow} style={{ padding: "10px 22px", borderRadius: 10, background: "#00B894", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>▶ Approve & Run</button>
                )}
                {/* Step 4: Running / Complete */}
                {workflowStep === 4 && (
                  <>
                    {runComplete && (
                      <>
                        <button onClick={() => { if (runWorkflowRef.current) clearTimeout(runWorkflowRef.current); setRunComplete(false); setAgentThoughts([]); setActiveAgents([]); runWorkflow(); }} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #00B894", background: "#F0FFF4", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#00B894" }}>🔄 Re-run</button>
                        <button onClick={handleSaveAsTemplate} style={{ padding: "10px 18px", borderRadius: 10, background: "#6C5CE7", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>💾 Save as Template</button>
                        <button onClick={() => { setScheduleTarget("Custom Workflow"); setShowScheduleModal(true); }} style={{ padding: "10px 18px", borderRadius: 10, background: "#2D1B69", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>⏰ Schedule</button>
                      </>
                    )}
                    {isRunning && !hitlPaused && !constraintPaused && (
                      <div style={{ padding: "10px 20px", borderRadius: 10, background: "#F9F8FE", border: "1px solid #E8E6F0", fontSize: 13, color: "#6C5CE7", fontWeight: 600 }}>⏳ Running...</div>
                    )}
                    {isRunning && (hitlPaused || constraintPaused) && (
                      <div style={{ padding: "10px 20px", borderRadius: 10, background: "#FFF8E1", border: "1px solid #FFE082", fontSize: 13, color: "#E65100", fontWeight: 600 }}>⏸ Waiting for your approval...</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Brain Panel */}
      {showAgentBrain && (
        <AgentBrainPanel
          thoughts={agentThoughts} isRunning={isRunning} activeAgents={activeAgents} connectors={connectors}
          hitlPaused={hitlPaused} hitlCheckpoint={hitlCheckpoint} hitlAdjustMode={hitlAdjustMode} hitlAdjustText={hitlAdjustText}
          onHitlApprove={handleHitlApprove} onHitlStartAdjust={() => setHitlAdjustMode(true)} onHitlAdjustTextChange={setHitlAdjustText} onHitlAdjustSubmit={handleHitlAdjust}
          constraintPaused={constraintPaused} constraintData={constraintData} constraintInput={constraintInput}
          onConstraintInputChange={setConstraintInput} onConstraintApply={handleConstraintApply} onConstraintSkip={handleConstraintSkip}
        />
      )}
    </div>
  );

  const renderTemplates = () => (
    <div style={{ display: "flex", flex: 1, height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>📋 Templates</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Browse, configure, and launch pre-built workflows</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {!selectedTemplate ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {SAMPLE_TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setSelectedTemplate(t)} style={{ border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px", cursor: "pointer", background: "#fff", transition: "all 0.2s", position: "relative" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#6C5CE7"} onMouseLeave={e => e.currentTarget.style.borderColor = "#E8E6F0"}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3, flex: 1 }}>{t.name}</div>
                    {t.shared && <span style={{ fontSize: 10, padding: "2px 8px", background: "#F0EDFF", color: "#6C5CE7", borderRadius: 20, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Shared</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5, marginBottom: 12 }}>{t.desc}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                    {t.agents.map(a => <AgentBadge key={a} agent={a} small />)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#999" }}>by {t.author} · {t.lastRun}</span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.status === "active" ? "#00B894" : "#FDCB6E" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={() => { setSelectedTemplate(null); setTemplateEditMode(false); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 16 }}>← Back to Templates</button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>{selectedTemplate.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{selectedTemplate.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowShareModal(true)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 12, cursor: "pointer" }}>🔗 Share</button>
                  <button onClick={() => setTemplateEditMode(!templateEditMode)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: templateEditMode ? "#F0EDFF" : "#fff", fontSize: 12, cursor: "pointer" }}>✏️ {templateEditMode ? "Editing" : "Edit"}</button>
                </div>
              </div>

              {/* Agent workflow for this template */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>Super Agent Workflow</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {selectedTemplate.agents.map((agentId, idx) => {
                  const agent = SUPER_AGENTS.find(a => a.id === agentId);
                  const isExp = expandedAgent === agentId;
                  return (
                    <div key={agentId} style={{ border: "1px solid #E8E6F0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                      <div onClick={() => setExpandedAgent(isExp ? null : agentId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 24, height: 24, background: agent.color + "20", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{agent.icon}</div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>Step {idx + 1} — {agent.name}</span>
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                      {isExp && (
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #E8E6F0", background: "#FAFAFE" }}>
                          <textarea
                            defaultValue={SIMULATED_AGENT_THOUGHTS[agentId]?.[0] || agent.desc}
                            disabled={!templateEditMode}
                            style={{ width: "100%", minHeight: 70, padding: 12, borderRadius: 8, border: "1px solid #DDD", fontSize: 12, lineHeight: 1.6, resize: "vertical", fontFamily: "'DM Sans', sans-serif", outline: "none", background: templateEditMode ? "#fff" : "#F5F5F5" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Input Data Preview for template */}
              {selectedTemplate && <InputDataPreview useCaseId={selectedTemplate.id} />}

              {/* Connectors */}
              <ConnectorsSection connectors={connectors} onToggle={toggleConnector} onManage={() => setShowConnectData(true)} />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { resetHome(); setActiveUseCaseId(selectedTemplate.id); setWorkflowCreated(true); setSelectedWorkflowAgents(selectedTemplate.agents); setUserPrompt(selectedTemplate.desc); setWorkflowStep(4); setPage("home"); setSelectedTemplate(null); setTimeout(() => runWorkflow(), 100); }} style={{ padding: "10px 20px", borderRadius: 10, background: "#00B894", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>▶ Run Now</button>
                <button onClick={() => { setScheduleTarget(selectedTemplate.name); setShowScheduleModal(true); }} style={{ padding: "10px 20px", borderRadius: 10, background: "#2D1B69", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>⏰ Schedule</button>
                {templateEditMode && <button onClick={() => { setNotifications(prev => [{ id: "tn" + Date.now(), type: "success", msg: `Saved your copy of "${selectedTemplate.name}"`, time: "Just now", read: false }, ...prev]); setTemplateEditMode(false); }} style={{ padding: "10px 20px", borderRadius: 10, background: "#6C5CE7", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>💾 Save My Copy</button>}
              </div>
            </div>
          )}
        </div>
      </div>
      {showAgentBrain && <AgentBrainPanel thoughts={agentThoughts} isRunning={isRunning} activeAgents={activeAgents} connectors={connectors} />}
    </div>
  );

  const renderTriggers = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>⏰ Triggers</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Manage scheduled and automated workflow runs</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {triggers.map(tr => (
            <div key={tr.id} style={{ border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 22px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{tr.template}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: tr.status === "active" ? "#F0FFF4" : "#FFF8E1", color: tr.status === "active" ? "#00B894" : "#F39C12" }}>{tr.status === "active" ? "● Active" : "⏸ Paused"}</span>
                  <button onClick={() => setTriggers(prev => prev.map(t => t.id === tr.id ? { ...t, status: t.status === "active" ? "paused" : "active" } : t))} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>
                    {tr.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button onClick={() => setTriggers(prev => prev.filter(t => t.id !== tr.id))} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #FFC0C0", background: "#FFF5F5", fontSize: 11, cursor: "pointer", color: "#E74C3C" }}>Delete</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#666" }}>
                <div><span style={{ fontWeight: 600 }}>Schedule:</span> {tr.schedule}</div>
                <div><span style={{ fontWeight: 600 }}>Next Run:</span> {tr.nextRun}</div>
                <div>
                  <span style={{ fontWeight: 600 }}>Last: </span>
                  <span style={{ color: tr.lastStatus === "success" ? "#00B894" : tr.lastStatus === "failed" ? "#E74C3C" : "#F39C12", fontWeight: 600 }}>
                    {tr.lastStatus === "success" ? "✓ Success" : tr.lastStatus === "failed" ? "✗ Failed" : "⚠ Warning"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { setScheduleTarget("New Workflow"); setShowScheduleModal(true); }} style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, border: "2px dashed #DDD", background: "#FAFAFE", fontSize: 13, cursor: "pointer", width: "100%", color: "#888", fontWeight: 500, transition: "all 0.2s" }} onMouseEnter={e => e.target.style.borderColor = "#6C5CE7"} onMouseLeave={e => e.target.style.borderColor = "#DDD"}>
          + Create New Trigger
        </button>
      </div>
    </div>
  );

  const renderRelics = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>📦 Your Relics</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>View all outputs, share and edit them</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {relics.map(r => (
            <div key={r.id} style={{ border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3 }}>{r.name}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {r.shared && <span style={{ fontSize: 9, padding: "2px 6px", background: "#F0EDFF", color: "#6C5CE7", borderRadius: 20, fontWeight: 600 }}>Shared</span>}
                  <span style={{ fontSize: 9, padding: "2px 6px", background: "#F5F5F5", color: "#888", borderRadius: 20, fontWeight: 600 }}>.{r.type}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{r.date}</div>
              {r.sharedBy && <div style={{ fontSize: 11, color: "#6C5CE7", marginBottom: 4 }}>Shared by {r.sharedBy}</div>}
              <div style={{ fontSize: 11, color: "#AAA", marginBottom: 12 }}>{r.size}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setNotifications(prev => [{ id: "dl" + Date.now(), type: "info", msg: `Downloading ${r.name}...`, time: "Just now", read: false }, ...prev])} style={{ padding: "7px 14px", borderRadius: 8, background: "#00B894", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>⬇ Download</button>
                <button onClick={() => setShowShareModal(true)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>🔗</button>
                <button onClick={() => { setPage("home"); setWorkflowCreated(true); setWorkflowStep(1); setSelectedWorkflowAgents(["ingestiq", "demandiq", "optimaiq", "visioniq"]); setUserPrompt(r.name); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>✏️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCollaboration = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>👥 Collaboration</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Manage team members and shared access</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Team Members</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 30 }}>
          {COLLABORATORS.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "1px solid #E8E6F0", borderRadius: 12, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#6C5CE7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{u.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{u.email}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: u.role === "Owner" ? "#2D1B69" : u.role === "Editor" ? "#6C5CE7" : "#E8E6F0", color: u.role === "Viewer" ? "#666" : "#fff", fontWeight: 600 }}>{u.role}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Shared With Me</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {SAMPLE_TEMPLATES.filter(t => t.shared && t.author !== "Debonil Chowdhury").map(t => (
            <div key={t.id} style={{ border: "1px solid #E8E6F0", borderRadius: 12, padding: "14px 18px", background: "#fff" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>by {t.author}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setSelectedTemplate(t); setPage("templates"); }} style={{ padding: "6px 14px", borderRadius: 8, background: "#F0EDFF", color: "#6C5CE7", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Open</button>
                <button onClick={() => setShowShareModal(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>Manage Access</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocs = () => {
    const DocSection = ({ title, children, icon }) => (
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span> {title}
        </div>
        <div style={{ fontSize: 13.5, color: "#444", lineHeight: 1.85 }}>{children}</div>
      </div>
    );

    const AgentDoc = ({ agent }) => {
      const a = SUPER_AGENTS.find(x => x.id === agent.id);
      return (
        <div style={{ border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 24px", background: "#fff", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{a.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>{a.name}</div>
              <div style={{ fontSize: 12, color: a.color, fontWeight: 600 }}>{agent.tagline}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8, marginBottom: 12 }}>{agent.description}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Key Capabilities</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {agent.capabilities.map((c, i) => (
              <span key={i} style={{ padding: "4px 12px", borderRadius: 20, background: a.color + "10", color: a.color, fontSize: 11, fontWeight: 500 }}>{c}</span>
            ))}
          </div>
        </div>
      );
    };

    const agentDocs = [
      {
        id: "ingestiq",
        tagline: "Universal Data Ingestion Engine",
        description: "IngestIQ is the entry point of every HarmonIQ workflow. It connects to diverse data sources — local files, cloud storage (Google Drive, iCloud, OneDrive, SharePoint), databases, and APIs — and automatically parses, normalises, and quality-checks incoming data. It detects schemas, handles missing values, resolves format inconsistencies, and stages clean, analysis-ready datasets for all downstream Super Agents. Think of it as HarmonIQ's universal data translator.",
        capabilities: ["Multi-format parsing (CSV, Excel, Parquet, JSON, PDF)", "Schema auto-detection", "Null imputation & data quality scoring", "Cloud & database connectors", "Real-time streaming ingestion"],
      },
      {
        id: "visioniq",
        tagline: "Visual Analytics & Chart Intelligence",
        description: "VisionIQ transforms processed data into compelling visual narratives. It automatically selects the most appropriate chart types for your data — time-series decompositions, comparative bar charts, heatmaps, scatter plots, and more — and generates publication-ready visualisations. VisionIQ understands statistical context and annotates charts with trend lines, confidence intervals, and anomaly markers to tell the story behind the data.",
        capabilities: ["Auto chart type selection", "Time-series decomposition", "Heatmap generation", "Trend & anomaly annotation", "Report-ready visual exports"],
      },
      {
        id: "visioniq_plus",
        tagline: "Advanced Computer Vision & Document AI",
        description: "VisionIQ+ extends HarmonIQ into the physical world. It processes shelf images, product photos, scanned documents, and PDF invoices using state-of-the-art vision transformers and OCR pipelines. It can detect product facings on shelves, calculate share-of-shelf metrics, audit planogram compliance, extract tables from unstructured documents, and digitise handwritten notes — bridging the gap between physical retail and digital intelligence.",
        capabilities: ["Shelf image analysis", "Planogram compliance auditing", "Share-of-shelf computation", "OCR & table extraction", "Product recognition & counting"],
      },
      {
        id: "marketiq",
        tagline: "Competitive Intelligence & Market Signals",
        description: "MarketIQ is your always-on competitive radar. It monitors competitor pricing, promotional activity, market share movements, and category trends from syndicated data, web sources, and configured feeds. It computes price elasticity curves, detects competitive threats in real-time, and synthesises market intelligence summaries that inform strategic decisions. MarketIQ ensures you never get blindsided by a competitor move.",
        capabilities: ["Competitor price tracking", "Price elasticity modelling", "Market share analysis", "Category trend detection", "Competitive threat alerts"],
      },
      {
        id: "demandiq",
        tagline: "Ensemble Demand Forecasting Engine",
        description: "DemandIQ is the analytical powerhouse of HarmonIQ. It fits ensemble forecast models — combining ARIMA, Prophet, XGBoost, and other algorithms — on historical sell-through data at SKU × location granularity. It automatically engineers features (lags, rolling windows, Fourier terms, holiday regressors), cross-validates across multiple folds, blends model outputs with optimised weights, and generates forward forecasts with calibrated confidence intervals. DemandIQ identifies at-risk SKUs, detects demand anomalies, and provides the demand signal that drives OptimaIQ's optimisation.",
        capabilities: ["Ensemble model fitting (ARIMA, Prophet, XGBoost)", "Automated feature engineering", "Cross-validated accuracy metrics", "Confidence interval generation", "SKU-level stockout risk scoring"],
      },
      {
        id: "optimaiq",
        tagline: "Decision Optimisation & Scenario Planning",
        description: "OptimaIQ is the decision layer of HarmonIQ. It takes forecasts from DemandIQ, intelligence from MarketIQ, and constraints from your business rules, then formulates and solves multi-objective optimisation problems. Using mixed-integer linear programming (MILP) and heuristic solvers, it evaluates thousands of scenario combinations across pricing, inventory allocation, promotional spend, and markdown strategies. OptimaIQ outputs actionable, SKU-level recommendations that maximise revenue while respecting margin floors, budget limits, and service-level targets.",
        capabilities: ["Multi-objective optimisation (MILP)", "Scenario evaluation at scale", "Pricing & discount strategy", "Inventory allocation", "Constraint-aware recommendations"],
      },
    ];

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>📖 Documentation</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Learn about HarmonIQ, its architecture, and each Super Agent</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", maxWidth: 860 }}>

          {/* Hero */}
          <div style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D1554 100%)", borderRadius: 18, padding: "36px 40px", marginBottom: 36 }}>
            <div style={{ marginBottom: 12 }}>
              <HarmonIQLogo variant="large" />
            </div>
            <div style={{ fontSize: 15, color: "#A8A3B8", lineHeight: 1.8, maxWidth: 600, marginTop: 16 }}>
              The Decision Workflow Operating System for the Agentic Enterprise — orchestrating AI Super Agents to transform enterprise data into optimised, actionable decisions.
            </div>
          </div>

          {/* What is HarmonIQ */}
          <DocSection title="What is HarmonIQ?" icon="🧠">
            <p style={{ marginBottom: 12 }}>
              HarmonIQ is the Decision Workflow Operating System for the Agentic Enterprise, built on an agentic AI architecture. At its core, a <strong>Mother Agent</strong> orchestrates a network of six specialised <strong>Super Agents</strong> — each an expert in a distinct domain — to collaboratively solve complex business problems end-to-end.
            </p>
            <p style={{ marginBottom: 12 }}>
              Unlike traditional analytics tools that require manual pipeline stitching, HarmonIQ's Mother Agent automatically decomposes a user's natural-language goal into a multi-step plan, routes sub-tasks to the right Super Agents, manages data handoffs between them, and synthesises their outputs into unified, actionable recommendations.
            </p>
            <p>
              The platform supports <strong>Human-in-the-Loop (HITL)</strong> control at every stage — users can inspect, modify, and override each Super Agent's instructions before execution, ensuring full transparency and trust in the AI's reasoning process.
            </p>
          </DocSection>

          {/* How it works */}
          <DocSection title="How HarmonIQ Works" icon="⚙️">
            <div style={{ background: "#F9F8FE", borderRadius: 14, padding: "20px 24px", border: "1px solid #E8E6F0", marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { step: "1", title: "Describe Your Goal", desc: "Tell the Mother Agent what you want to achieve in plain English. For example: 'Analyse back-to-school demand and recommend a pricing strategy to hit our 400K unit target while preserving 15% margin.'" },
                  { step: "2", title: "Automatic Orchestration", desc: "The Mother Agent decomposes your goal into sub-tasks and assembles a workflow of Super Agents. You can see the full plan, expand each agent's instructions, and edit them (HITL) before running." },
                  { step: "3", title: "Connect Your Data", desc: "Attach data sources via connectors — upload files, connect to a database, or link cloud storage (Google Drive, iCloud, OneDrive, SharePoint). IngestIQ handles parsing and normalisation." },
                  { step: "4", title: "Execute & Monitor", desc: "Run the workflow and watch the Agent Brain panel in real-time. Each Super Agent streams its thought process — what it's analysing, which models it's fitting, what issues it's finding — giving full transparency." },
                  { step: "5", title: "Review & Act", desc: "Review the solution: metrics, forecasts, recommendations, and downloadable output files. If results look good, save the workflow as a reusable Template." },
                  { step: "6", title: "Automate & Scale", desc: "Schedule templates to run on recurring triggers (daily, weekly, monthly). Share with your team. HarmonIQ notifies you when scheduled runs complete, fail, or need attention." },
                ].map(s => (
                  <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#7C3AED", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 2 }}>{s.title}</div>
                      <div style={{ fontSize: 12.5, color: "#555", lineHeight: 1.7 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DocSection>

          {/* Architecture */}
          <DocSection title="Platform Architecture" icon="🏗️">
            <div style={{ background: "#1E1E2E", borderRadius: 14, padding: "24px 28px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 2, color: "#B8B5C8" }}>
                <div style={{ color: "#546E7A" }}>{'// HarmonIQ Agentic Architecture'}</div>
                <div><span style={{ color: "#C792EA" }}>User</span> <span style={{ color: "#546E7A" }}>→</span> <span style={{ color: "#FFCB6B" }}>Mother Agent</span> <span style={{ color: "#546E7A" }}>(orchestrator)</span></div>
                <div style={{ color: "#546E7A" }}>{'  ├──'} <span style={{ color: "#6C5CE7" }}>IngestIQ</span>    <span style={{ color: "#546E7A" }}>// data ingestion & normalisation</span></div>
                <div style={{ color: "#546E7A" }}>{'  ├──'} <span style={{ color: "#00B894" }}>VisionIQ</span>   <span style={{ color: "#546E7A" }}>// visual analytics & charts</span></div>
                <div style={{ color: "#546E7A" }}>{'  ├──'} <span style={{ color: "#0984E3" }}>VisionIQ+</span>  <span style={{ color: "#546E7A" }}>// computer vision & document AI</span></div>
                <div style={{ color: "#546E7A" }}>{'  ├──'} <span style={{ color: "#E17055" }}>MarketIQ</span>   <span style={{ color: "#546E7A" }}>// competitive intelligence</span></div>
                <div style={{ color: "#546E7A" }}>{'  ├──'} <span style={{ color: "#FDCB6E" }}>DemandIQ</span>   <span style={{ color: "#546E7A" }}>// demand forecasting</span></div>
                <div style={{ color: "#546E7A" }}>{'  └──'} <span style={{ color: "#A29BFE" }}>OptimaIQ</span>   <span style={{ color: "#546E7A" }}>// decision optimisation</span></div>
                <div style={{ marginTop: 8, color: "#546E7A" }}>{'  ↓'}</div>
                <div><span style={{ color: "#C3E88D" }}>Output</span> <span style={{ color: "#546E7A" }}>→</span> Relics <span style={{ color: "#546E7A" }}>(reports, files, recommendations)</span></div>
              </div>
            </div>
            <p style={{ marginBottom: 12 }}>
              The <strong>Mother Agent</strong> serves as the central orchestrator. It receives the user's goal, creates an execution plan, manages inter-agent data flow, handles error recovery, and assembles the final output. Each Super Agent operates autonomously within its domain but receives context and constraints from the Mother Agent.
            </p>
            <p>
              All agent interactions are streamed to the <strong>Agent Brain</strong> panel in real-time, providing full observability into the reasoning chain. This transparency is critical for enterprise trust — you can see exactly why each decision was made.
            </p>
          </DocSection>

          {/* Super Agents */}
          <DocSection title="The Six Super Agents" icon="🤖">
            <p style={{ marginBottom: 16 }}>Each Super Agent is a specialised AI system, expert in its domain. The Mother Agent composes them dynamically based on the task at hand — not every workflow uses all six.</p>
            {agentDocs.map(a => <AgentDoc key={a.id} agent={a} />)}
          </DocSection>

          {/* Key Concepts */}
          <DocSection title="Key Concepts" icon="💡">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { term: "Templates", def: "Saved workflow configurations that can be reused, shared, and scheduled. A template captures the goal, agent pipeline, instructions, and data connections." },
                { term: "Triggers", def: "Automated schedules that run templates at recurring intervals — daily, weekly, bi-weekly, or monthly. You receive notifications on completion or failure." },
                { term: "Relics", def: "Output artifacts generated by workflow runs — reports, spreadsheets, PDFs, and recommendation files. Relics are versioned and can be shared across the team." },
                { term: "HITL (Human-in-the-Loop)", def: "The ability to inspect and modify each Super Agent's instructions before execution. Ensures human oversight and control over AI decision-making." },
                { term: "Agent Brain", def: "The real-time observability panel that streams each agent's thought process, reasoning steps, and intermediate outputs as a workflow executes." },
                { term: "Connectors", def: "Pre-built integrations to data sources: local file upload, database connections, Google Drive, iCloud, OneDrive, and SharePoint." },
              ].map(c => (
                <div key={c.term} style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid #E8E6F0", background: "#FAFAFE" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", marginBottom: 4 }}>{c.term}</div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>{c.def}</div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* FAQ */}
          <DocSection title="Frequently Asked Questions" icon="❓">
            {[
              { q: "Can I use HarmonIQ without technical expertise?", a: "Yes. HarmonIQ is designed for business users. You describe your goal in plain English, and the Mother Agent handles all the technical orchestration. You only need to connect your data and review the results." },
              { q: "How does HITL work in practice?", a: "After the Mother Agent creates a plan, you can expand any Super Agent's step to see and edit its instructions. For example, you might tell DemandIQ to 'exclude promotional periods from the baseline' or instruct OptimaIQ to 'prioritise margin over volume'. These edits are applied before execution." },
              { q: "What data formats does IngestIQ support?", a: "IngestIQ handles CSV, Excel (.xlsx), Parquet, JSON, PDF (with table extraction), and connects to SQL databases, Google Drive, iCloud, OneDrive, and SharePoint. It auto-detects schemas and handles encoding, delimiter, and format variations." },
              { q: "Can multiple team members collaborate on a workflow?", a: "Yes. Workflows, templates, and relics can be shared with specific team members or groups with granular access levels: Viewer (read-only), Editor (can modify), and Manager (can share and manage access)." },
              { q: "How are scheduled triggers monitored?", a: "You receive in-app notifications when scheduled runs complete successfully, finish with warnings, or fail. The Triggers page shows run history, next scheduled time, and last-run status for every active trigger." },
            ].map((faq, i) => (
              <div key={i} style={{ marginBottom: 16, padding: "16px 20px", borderRadius: 12, border: "1px solid #E8E6F0", background: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>{faq.q}</div>
                <div style={{ fontSize: 12.5, color: "#555", lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </DocSection>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "24px 0 40px", borderTop: "1px solid #E8E6F0", marginTop: 12 }}>
            <HarmonIQLogo variant="light" />
            <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>The Decision Workflow Operating System for the Agentic Enterprise</div>
            <div style={{ fontSize: 11, color: "#BBB", marginTop: 4 }}>© 2026 Aria Intelligent Solutions. All rights reserved.</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCanvas = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid #E8E6F0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E" }}>🖼 Canvas</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Interactive analysis reports with charts, tables, and insights</div>
          </div>
          {canvasSelectedUseCase && (
            <button onClick={() => setCanvasSelectedUseCase(null)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 12, cursor: "pointer" }}>← Back to Gallery</button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: canvasSelectedUseCase ? "0" : "20px 28px" }}>
        {!canvasSelectedUseCase ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 16 }}>Analysis Reports</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {SAMPLE_TEMPLATES.map(t => {
                const hasReport = !!CANVAS_REPORTS[t.id];
                return (
                  <div key={t.id} style={{ border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px", background: "#fff", transition: "all 0.2s", cursor: hasReport ? "pointer" : "default", opacity: hasReport ? 1 : 0.5 }} onClick={() => hasReport && setCanvasSelectedUseCase(t.id)} onMouseEnter={e => hasReport && (e.currentTarget.style.borderColor = "#7C3AED")} onMouseLeave={e => (e.currentTarget.style.borderColor = "#E8E6F0")}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3, flex: 1 }}>{t.name}</div>
                      <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: hasReport ? "#F0EDFF" : "#F5F5F5", color: hasReport ? "#7C3AED" : "#999", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{hasReport ? "Ready" : "Pending"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5, marginBottom: 12 }}>{t.desc.slice(0, 120)}...</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {t.agents.map(a => <AgentBadge key={a} agent={a} small />)}
                    </div>
                    {hasReport && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setCanvasSelectedUseCase(t.id); }} style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #7C3AED, #2D1554)", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View Report</button>
                        <button onClick={(e) => { e.stopPropagation(); setNotifications(prev => [{ id: "cdl" + Date.now(), type: "info", msg: `Downloading Canvas report for "${t.name}"...`, time: "Just now", read: false }, ...prev]); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>⬇ Download</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 28px", borderBottom: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAFE" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>{SAMPLE_TEMPLATES.find(t => t.id === canvasSelectedUseCase)?.name || "Report"}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Interactive HTML Canvas Report</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setNotifications(prev => [{ id: "cdl2" + Date.now(), type: "info", msg: "Downloading Canvas report as HTML...", time: "Just now", read: false }, ...prev])} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>⬇ Download HTML</button>
                <button onClick={() => setShowShareModal(true)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#fff", fontSize: 11, cursor: "pointer" }}>🔗 Share</button>
              </div>
            </div>
            <iframe
              srcDoc={CANVAS_REPORTS[canvasSelectedUseCase] || "<html><body><p>Report not available</p></body></html>"}
              style={{ flex: 1, border: "none", width: "100%", background: "#F5F4FA" }}
              title="Canvas Report"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );

  const pageRenderer = { home: renderHome, templates: renderTemplates, triggers: renderTriggers, relics: renderRelics, canvas: renderCanvas, collaboration: renderCollaboration, docs: renderDocs };

  const handleLogin = () => {
    if (!loginEmail.trim()) { setLoginError("Please enter your email"); return; }
    if (!loginPassword.trim()) { setLoginError("Please enter your password"); return; }
    setLoginError("");
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      setIsLoggedIn(true);
    }, 1800);
  };

  const handleSSOLogin = (provider) => {
    setLoginLoading(true);
    setLoginError("");
    setTimeout(() => {
      setLoginLoading(false);
      setIsLoggedIn(true);
    }, 2200);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D0CDE0; border-radius: 10px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .thinking-dots { display: flex; gap: 4px; padding: 4px 0; }
        .thinking-dots span { width: 6px; height: 6px; border-radius: 50%; background: #6C5CE7; animation: pulse 1.2s infinite; }
        .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
        .thinking-dots-dark { display: flex; gap: 5px; padding: 4px 0; }
        .thinking-dots-dark span { width: 5px; height: 5px; border-radius: 50%; background: #C792EA; animation: pulse 1.2s infinite; }
        .thinking-dots-dark span:nth-child(2) { animation-delay: 0.25s; }
        .thinking-dots-dark span:nth-child(3) { animation-delay: 0.5s; }
        textarea:focus, input:focus { border-color: #7C3AED !important; }
        .login-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E2EE; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; background: #FAFAFE; }
        .login-input:focus { border-color: #7C3AED; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        .login-input::placeholder { color: #A8A3B8; }
        .login-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .login-btn:hover { transform: translateY(-1px); }
        .login-btn:active { transform: translateY(0); }
        .sso-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #E5E2EE; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; background: #fff; color: #333; transition: all 0.2s; }
        .sso-btn:hover { border-color: #7C3AED; background: #FAFAFE; }
      `}</style>

      {!isLoggedIn ? (
        /* ─── Login Page ─── */
        <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

          {/* Left Panel — Branding */}
          <div style={{
            flex: 1, background: "linear-gradient(155deg, #1A1A2E 0%, #2D1554 40%, #1A1A2E 100%)",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            position: "relative", overflow: "hidden", minWidth: 0,
          }}>
            {/* Decorative grid */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ position: "absolute", left: `${(i % 5) * 25}%`, top: `${Math.floor(i / 5) * 25}%`, width: 200, height: 200, border: "1px solid #fff", borderRadius: 30, transform: `rotate(${i * 18}deg)` }} />
              ))}
            </div>

            {/* Floating agent icons */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {SUPER_AGENTS.map((a, i) => (
                <div key={a.id} style={{
                  position: "absolute",
                  left: `${15 + (i % 3) * 30}%`,
                  top: `${20 + Math.floor(i / 3) * 35}%`,
                  fontSize: 28, opacity: 0.12,
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}>{a.icon}</div>
              ))}
            </div>

            <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 40px", maxWidth: 500 }}>
              <div style={{ marginBottom: 40, animation: "slideUp 0.8s ease" }}>
                <HarmonIQLogo variant="large" />
              </div>
              <div style={{ fontSize: 15, color: "#A8A3B8", lineHeight: 1.8, animation: "slideUp 0.8s ease 0.2s both" }}>
                The Decision Workflow Operating System for the Agentic Enterprise
              </div>
              <div style={{ fontSize: 13, color: "#6B6580", lineHeight: 1.8, marginTop: 12, animation: "slideUp 0.8s ease 0.35s both" }}>
                Orchestrate AI Super Agents to transform your data into actionable intelligence across demand forecasting, market analysis, and optimization.
              </div>

              {/* Agent badges */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 32, animation: "slideUp 0.8s ease 0.5s both" }}>
                {SUPER_AGENTS.map(a => (
                  <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, color: a.color }}>
                    {a.icon} {a.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom attribution */}
            <div style={{ position: "absolute", bottom: 28, fontSize: 11, color: "#4A4460" }}>
              Powered by <span style={{ fontWeight: 700, color: "#6B6580" }}>Aria Intelligent Solutions</span>
            </div>
          </div>

          {/* Right Panel — Login Form */}
          <div style={{
            width: 520, minWidth: 520, background: "#fff",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            padding: "40px 60px",
          }}>
            <div style={{ width: "100%", maxWidth: 380, animation: "slideUp 0.6s ease" }}>
              {/* Mobile-friendly logo */}
              <div style={{ marginBottom: 36 }}>
                <HarmonIQLogo variant="light" />
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1A1A2E", marginTop: 20 }}>Welcome back</div>
                <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Sign in to your workspace</div>
              </div>

              {/* SSO Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <button className="sso-btn" onClick={() => handleSSOLogin("microsoft")} disabled={loginLoading}>
                  <svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
                  Continue with Microsoft
                </button>
                <button className="sso-btn" onClick={() => handleSSOLogin("google")} disabled={loginLoading}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: "#E5E2EE" }} />
                <span style={{ fontSize: 12, color: "#A8A3B8", fontWeight: 500 }}>or sign in with email</span>
                <div style={{ flex: 1, height: 1, background: "#E5E2EE" }} />
              </div>

              {/* Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Email</label>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="debonil.chowdhury@aria-is.com"
                    value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); setLoginError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    disabled={loginLoading}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Password</label>
                  <input
                    className="login-input"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setLoginError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    disabled={loginLoading}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666", cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: "#7C3AED" }} />
                    Remember me
                  </label>
                  <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>Forgot password?</a>
                </div>

                {loginError && (
                  <div style={{ fontSize: 12, color: "#E74C3C", background: "#FFF5F5", padding: "10px 14px", borderRadius: 10, border: "1px solid #FFC0C0" }}>{loginError}</div>
                )}

                <button
                  className="login-btn"
                  onClick={handleLogin}
                  disabled={loginLoading}
                  style={{
                    background: loginLoading ? "#A78BFA" : "linear-gradient(135deg, #7C3AED 0%, #2D1554 100%)",
                    color: "#fff",
                    marginTop: 4,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {loginLoading ? (
                    <>
                      <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Signing in...
                    </>
                  ) : "Sign In"}
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#888" }}>
                Don't have an account? <a href="#" onClick={e => e.preventDefault()} style={{ color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>Request Access</a>
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* ─── Main App ─── */
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#F5F4FA", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
        {/* ─── Sidebar ─── */}
        <div style={{ width: sidebarCollapsed ? 56 : 200, minWidth: sidebarCollapsed ? 56 : 200, background: "#1A1A2E", display: "flex", flexDirection: "column", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden" }}>
          <HarmonIQLogo collapsed={sidebarCollapsed} />
          <div style={{ flex: 1, padding: sidebarCollapsed ? "8px 6px" : "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                onClick={() => { setPage(item.id); setSelectedTemplate(null); setExpandedAgent(null); if (item.id !== "canvas") setCanvasSelectedUseCase(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                  borderRadius: 10, cursor: "pointer", color: page === item.id ? "#A29BFE" : "#8888A8",
                  background: page === item.id ? "#2D1B69" : "transparent", transition: "all 0.2s",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start", fontSize: 13, fontWeight: page === item.id ? 600 : 400,
                }}
              >
                <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px", borderTop: "1px solid #2D1B69", display: "flex", justifyContent: sidebarCollapsed ? "center" : "space-between", alignItems: "center" }}>
            <div onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ cursor: "pointer", color: "#8888A8", display: "flex", padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6C5CE7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>DC</div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Main Area ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top Bar */}
          <div style={{ height: 48, minHeight: 48, background: "#fff", borderBottom: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div style={{ fontSize: 13, color: "#888" }}>
              {page === "home" ? "HarmonIQ / Home" : page === "templates" ? "HarmonIQ / Templates" : page === "triggers" ? "HarmonIQ / Triggers" : page === "relics" ? "HarmonIQ / Relics" : page === "canvas" ? "HarmonIQ / Canvas" : page === "docs" ? "HarmonIQ / Documentation" : "HarmonIQ / Collaboration"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
              <NotificationBell notifications={notifications} onClick={() => setShowNotifications(!showNotifications)} />
              {showNotifications && (
                <div style={{ position: "absolute", top: 36, right: 0, width: 360, background: "#fff", borderRadius: 14, border: "1px solid #E8E6F0", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 999, maxHeight: 400, overflow: "auto" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #E8E6F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>Notifications</span>
                    <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} style={{ fontSize: 11, color: "#6C5CE7", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{ padding: "12px 18px", borderBottom: "1px solid #F5F5F5", background: n.read ? "#fff" : "#FAFAFE", cursor: "pointer" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 14 }}>{n.type === "success" ? "✅" : n.type === "error" ? "❌" : n.type === "warning" ? "⚠️" : "ℹ️"}</span>
                        <div>
                          <div style={{ fontSize: 12, color: "#333", lineHeight: 1.5 }}>{n.msg}</div>
                          <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{n.time}</div>
                        </div>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6C5CE7", flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "#fff" }}>
            {pageRenderer[page]?.()}
          </div>
        </div>
      </div>
      )}

      {/* Modals */}
      {isLoggedIn && showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
      {isLoggedIn && showScheduleModal && (
        <ScheduleModal
          templateName={scheduleTarget}
          onClose={() => setShowScheduleModal(false)}
          onSave={(config) => {
            setTriggers(prev => [...prev, { id: "tr_new_" + Date.now(), template: scheduleTarget, schedule: `${config.freq === "daily" ? "Daily" : config.freq === "weekly" ? `Every ${config.day}` : config.freq === "biweekly" ? `Bi-weekly ${config.day}` : `Monthly ${config.day}`} ${config.time}`, nextRun: "Scheduled", status: "active", lastStatus: "success" }]);
            setNotifications(prev => [{ id: "ns" + Date.now(), type: "info", msg: `Trigger scheduled for "${scheduleTarget}"`, time: "Just now", read: false }, ...prev]);
          }}
        />
      )}
      {isLoggedIn && showConnectData && (
        <ConnectDataModal
          connectors={connectors}
          onToggle={toggleConnector}
          onClose={() => setShowConnectData(false)}
        />
      )}
    </>
  );
}
