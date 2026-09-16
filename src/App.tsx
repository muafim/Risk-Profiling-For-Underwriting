import { useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Database, FileChartColumn,
  GitCompareArrows, Layers3, Microscope, SearchCheck, ShieldAlert, Workflow,
} from "lucide-react";
import dataset from "./data/dataset-summary.json";
import original from "./data/original-analysis.json";
import modelComparison from "./data/model-comparison.json";
import experiment from "./data/experiment-v2.json";
import importance from "./data/feature-importance.json";
import clustering from "./data/clustering-summary.json";
import review from "./data/review-candidates.json";
import insightData from "./data/dashboard-insights.json";
import { SectionHeader } from "./components/editorial/SectionHeader";
import {
  AnomalyBoxplotChart, ClusterQualityChart, FeatureImportanceChart, ModelComparisonChart,
  ReasonFrequencyChart, RiskDistributionChart, ShuffleComparisonChart,
} from "./components/charts/DashboardCharts";
import { ReviewQueue } from "./components/review/ReviewQueue";
import type { ImportanceRow, ModelMetric, ReviewCandidate, RiskClass } from "./types/dashboard";

const pct = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const navItems = [
  ["overview", "Overview"], ["original-study", "Original Study"], ["diagnostics", "Model Diagnostics"],
  ["drivers", "Risk Drivers"], ["segmentation", "Segmentation"], ["review", "Review Queue"], ["methodology", "Methodology"],
];

function App() {
  const [importanceMode, setImportanceMode] = useState<"permutation" | "gain">("permutation");
  const [reasonWindow, setReasonWindow] = useState<"20" | "50" | "100">("100");
  const majority = dataset.majorityClass;
  const highest = modelComparison.highestObservedBalancedAccuracy;
  const topCandidates = (review.candidates as ReviewCandidate[]).slice(0, 5);
  const activeImportance = (importanceMode === "permutation" ? importance.permutation : importance.gain) as ImportanceRow[];

  return (
    <>
      <header className="site-nav">
        <a className="brand" href="#overview" aria-label="Insurance Risk Intelligence home">
          <ShieldAlert size={21} aria-hidden="true" />
          <span>IRI / 2026</span>
        </a>
        <nav aria-label="Primary navigation">
          {navItems.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="overview">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">Portfolio analytics case study / insurance</p>
            <h1>INSURANCE<br />RISK<br /><span>INTELLIGENCE</span></h1>
            <p className="hero-subtitle">From Risk Profiling Models to Model Diagnostics and Manual Review Prioritization</p>
            <p className="hero-deck">A data science case study on underwriting risk classification, customer segmentation, model learnability, and anomaly detection.</p>
            <div className="hero-meta"><strong>{compact.format(dataset.totalRecords)} customer records</strong><span>Risk profiling · segmentation · diagnostics</span></div>
          </div>
          <div className="hero-visual" aria-label="Editorial data composition showing the class distribution and model diagnostics">
            <div className="hero-grid-label">ASSIGNED RISK PROFILE / LABELED RECORDS</div>
            <div className="hero-risk-grid">
              {(dataset.riskClasses as RiskClass[]).map((item) => (
                <div key={item.label} className={`hero-risk hero-risk--${item.label.toLowerCase()}`} style={{ flex: item.share }}>
                  <span>{item.label}</span><strong>{pct(item.share)}</strong><small>{item.count.toLocaleString()}</small>
                </div>
              ))}
            </div>
            <div className="hero-signal">
              <span>HIGHEST OBSERVED<br />BALANCED ACCURACY</span>
              <strong>{pct(highest.value)}</strong>
              <em>only {pct(highest.distanceFromReference, 2)} above ⅓</em>
            </div>
            <div className="hero-matrix" aria-hidden="true">
              {Array.from({ length: 48 }, (_, i) => <span key={i} className={i % 11 === 0 || i % 17 === 0 ? "hot" : ""} />)}
            </div>
            <div className="hero-verdict">REAL LABELS <GitCompareArrows size={18} /> SHUFFLED LABELS</div>
          </div>
        </section>

        <section className="metric-strip" aria-label="Project summary metrics">
          {[
            [compact.format(dataset.totalRecords), "Customer Records"],
            [compact.format(dataset.labeledRecords), "Labeled Records"],
            [String(dataset.riskClasses.length), "Risk Classes"],
            [String(review.candidateCount), "Manual Review Candidates"],
          ].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </section>

        <section className="section section--data" id="data">
          <SectionHeader number="01" eyebrow="The data" title="150,000 RECORDS. ONE IMBALANCED TARGET." subtitle="The label distribution sets the first constraint on every classification result." />
          <div className="analysis-spread">
            <article className="panel chart-panel">
              <div className="panel-heading"><span>Risk Profile distribution</span><small>{dataset.labeledRecords.toLocaleString()} labeled / {dataset.unlabeledRecords.toLocaleString()} unlabeled</small></div>
              <RiskDistributionChart data={dataset.riskClasses as RiskClass[]} />
            </article>
            <aside className="editorial-callout navy-block">
              <Database size={25} aria-hidden="true" />
              <p className="eyebrow">Class structure</p>
              <strong>{pct(majority.share)}</strong>
              <h3>of labeled records are Low Risk</h3>
              <p>Any accuracy headline must be read against this majority share.</p>
            </aside>
          </div>
        </section>

        <section className="section" id="original-study">
          <SectionHeader number="02" eyebrow="Original study" title="ORIGINAL RISK PROFILING" subtitle="What the first modeling approach found" />
          <div className="workflow-line" aria-label="Original analysis workflow">
            {original.workflow.map((step, i) => <div key={step}><span>{String(i + 1).padStart(2, "0")}</span><strong>{step}</strong>{i < original.workflow.length - 1 && <ArrowRight aria-hidden="true" />}</div>)}
          </div>
          <div className="analysis-spread original-spread">
            <article className="story-panel">
              <p className="eyebrow">Original EDA insight</p>
              <h3>UNIFORM DATA</h3>
              <p className="story-lead">{original.eda.headline}</p>
              <ul className="plain-list">{original.eda.points.map((point) => <li key={point}>{point}</li>)}</ul>
              <div className="micro-stat"><span>Largest absolute numeric target correlation</span><strong>{Math.abs(original.eda.maxAbsoluteNumericCorrelation).toFixed(4)}</strong></div>
            </article>
            <article className="panel feature-pipeline">
              <div className="panel-heading"><span>Feature engineering</span><small>Useful transformations, not proof of improved signal</small></div>
              <div className="feature-grid">{original.engineeredFeatures.map((feature, i) => <div key={feature}><span>F{String(i + 1).padStart(2, "0")}</span><strong>{feature}</strong></div>)}</div>
            </article>
          </div>
          <div className="section-kicker"><p className="eyebrow">What the first models saw</p><h3>TWO EXPERIMENTS. TWO DIFFERENT FAILURE MODES.</h3></div>
          <div className="experiment-grid">
            {original.experiments.map((item) => (
              <article className="experiment-card" key={item.name}>
                <div><p className="eyebrow">{item.name}</p><strong className="big-number">{pct(item.accuracy, 0)}</strong><span>Accuracy</span></div>
                <div className="recall-list">{Object.entries(item.recall).map(([label, value]) => <div key={label}><span>{label} recall</span><strong>{Number(value).toFixed(2)}</strong></div>)}</div>
                <p>{item.interpretation}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="accuracy-trap" id="accuracy-trap">
          <div className="trap-heading"><span className="section-number" aria-hidden="true">03</span><p className="eyebrow">The decisive baseline</p><h2>THE 60%<br />ACCURACY TRAP</h2></div>
          <div className="trap-equation">
            <div><span>LOW RISK SHARE</span><strong>{pct(majority.share)}</strong></div>
            <b>≈</b>
            <div><span>DUMMY ACCURACY</span><strong>{pct(modelComparison.models.find((m) => m.model === "Dummy majority")!.accuracy)}</strong></div>
          </div>
          <blockquote>A classifier can reach nearly 60% accuracy simply by predicting every customer as Low Risk.</blockquote>
        </section>

        <section className="question-break">
          <p className="eyebrow">So we asked a better question</p>
          <h2>CAN THIS TARGET<br />ACTUALLY BE LEARNED?</h2>
          <p>Experiment V2 shifts the focus from maximizing accuracy to diagnosing target learnability.</p>
        </section>

        <section className="section" id="diagnostics">
          <SectionHeader number="04" eyebrow="Experiment V2" title="MODEL PERFORMANCE" subtitle="Accuracy does not tell the full story" />
          <div className="analysis-spread">
            <article className="panel chart-panel">
              <div className="panel-heading"><span>Holdout metrics by model</span><small>Sorted by Macro-F1</small></div>
              <ModelComparisonChart models={modelComparison.models as ModelMetric[]} reference={modelComparison.referenceBalancedAccuracy} />
            </article>
            <aside className="editorial-callout outline-callout">
              <BarChart3 size={26} aria-hidden="true" />
              <p className="eyebrow">Highest observed balanced accuracy</p>
              <strong>{pct(highest.value)}</strong>
              <h3>{highest.model}</h3>
              <p>Only {pct(highest.distanceFromReference)} above the one-third reference. This is not evidence of reliable class discrimination.</p>
            </aside>
          </div>

          <div className="full-bleed-data shuffle-block">
            <div className="shuffle-copy">
              <p className="eyebrow">Target shuffle test</p><h3>REAL SIGNAL OR<br />RANDOM NOISE?</h3>
              <p>Model performance on the real target is effectively indistinguishable from performance after the labels are randomly shuffled.</p>
            </div>
            <div className="panel shuffle-panel"><ShuffleComparisonChart data={experiment.shuffleTest} /><div className="chart-annotation">Real labels ≈ shuffled labels</div></div>
          </div>

          <div className="verdict-block">
            <Microscope size={35} aria-hidden="true" />
            <div><p className="eyebrow">Target learnability verdict</p><h3>LIMITED TARGET LEARNABILITY</h3><p>{experiment.verdict}</p></div>
          </div>

          <div className="analysis-spread resampling-spread">
            <article>
              <p className="eyebrow">Imbalance experiment</p><h3>DID RESAMPLING HELP?</h3>
              <p>The original notebook created BorderlineSMOTE data, but downstream models were trained on the original <code>X_train / y_train</code>. V2 corrected that workflow using SMOTENC on a stratified training subsample.</p>
              <div className="process-comparison"><span>ORIGINAL TRAINING ARRAYS</span><ArrowRight /><span>CORRECTED SMOTENC</span><ArrowRight /><strong>NO RECOVERED SIGNAL</strong></div>
            </article>
            <aside className="smote-metric"><span>Corrected SMOTENC + LightGBM</span><strong>{pct(experiment.smotenc.balancedAccuracy)}</strong><em>Balanced Accuracy</em><b>{pct(experiment.smotenc.macroF1)} Macro-F1</b><small>{experiment.smotenc.trainingSubsample.toLocaleString()}-row stratified training subsample</small></aside>
          </div>
        </section>

        <section className="section section--tinted" id="drivers">
          <SectionHeader number="05" eyebrow="Risk driver diagnostics" title="RISK DRIVERS?" subtitle="The data says: be careful" />
          <div className="panel chart-panel importance-panel">
            <div className="panel-heading panel-heading--controls">
              <div><span>Top 10 feature ranking</span><small>{importanceMode === "permutation" ? "Mean macro-F1 drop ± permutation standard deviation" : "LightGBM model gain"}</small></div>
              <div className="segmented-control" role="group" aria-label="Feature importance measure">
                <button className={importanceMode === "permutation" ? "active" : ""} onClick={() => setImportanceMode("permutation")}>Permutation Importance</button>
                <button className={importanceMode === "gain" ? "active" : ""} onClick={() => setImportanceMode("gain")}>Model Gain</button>
              </div>
            </div>
            <FeatureImportanceChart rows={activeImportance} mode={importanceMode} />
            <div className="chart-disclaimer"><AlertTriangle size={18} aria-hidden="true" /><span>{importanceMode === "permutation" ? importance.disclaimer : "Split/gain importance shows how often a tree used a feature, not whether the feature has reliable predictive value."}</span></div>
          </div>
        </section>

        <section className="section" id="segmentation">
          <SectionHeader number="06" eyebrow="Customer segmentation" title="WHEN CLASSIFICATION IS WEAK, SEGMENTATION CAN STILL SUPPORT EXPLORATION" />
          <p className="section-intro">The original RFM analysis asks a different question from Risk Profile classification. It explores behavioral and financial groupings; it does not solve the supervised target problem.</p>
          <div className="rfm-grid">
            {clustering.combinations.slice(0, 2).map((combo) => (
              <article className="rfm-card" key={combo.name}>
                <div className="rfm-index">{combo.name.endsWith("1") ? "01" : "02"}</div>
                <p className="eyebrow">{combo.name}</p><h3>k = {combo.k}</h3>
                <dl><div><dt>Recency</dt><dd>{combo.recency}</dd></div><div><dt>Frequency</dt><dd>{combo.frequency}</dd></div><div><dt>Monetary</dt><dd>{combo.monetary}</dd></div></dl>
                <div className="rfm-metrics"><span><strong>{combo.silhouette.toFixed(4)}</strong>Silhouette</span><span><strong>{combo.daviesBouldin.toFixed(4)}</strong>Davies-Bouldin</span></div>
                <p className="support-label">Exploratory support</p><p>{combo.supports?.join(" · ")}</p>
              </article>
            ))}
          </div>
          <div className="analysis-spread cluster-spread">
            <article className="panel"><div className="panel-heading"><span>Clustering quality</span><small>Higher silhouette indicates clearer separation</small></div><ClusterQualityChart data={clustering.combinations.map((item) => ({ name: item.name, silhouette: item.silhouette }))} /></article>
            <aside className="editorial-callout orange-block"><Layers3 size={26} /><p className="eyebrow">Weak natural separation</p><h3>Clusters overlap substantially</h3><p>{clustering.comparisonNote}</p></aside>
          </div>
        </section>

        <section className="section review-section" id="review">
          <SectionHeader number="07" eyebrow="Anomaly screening" title="MANUAL REVIEW QUEUE" subtitle="Unusual underwriting profiles prioritized for human review" inverse />
          <div className="review-disclosure"><ShieldAlert size={21} /><strong>{review.disclosure}</strong><span>Anomaly scores are screening signals, not adverse-decision evidence.</span></div>
          <div className="candidate-strip">
            {topCandidates.map((candidate) => <article key={candidate.rank}><span>#{String(candidate.rank).padStart(2, "0")}</span><h3>{candidate.maskedCustomerId}</h3><p>{candidate.riskProfile} Risk · {candidate.anomalyScore.toFixed(3)}</p><ul>{candidate.reviewSignals.map((signal) => <li key={signal.label}>{signal.label}</li>)}</ul></article>)}
          </div>
          <div className="review-analysis-grid">
            <article className="review-chart-card">
              <div className="panel-heading panel-heading--controls"><div><span>What drives manual review?</span><small>Frequency of unusual features in ranked candidates</small></div><div className="segmented-control dark-control" role="group" aria-label="Candidate ranking window">{(["20", "50", "100"] as const).map((value) => <button key={value} onClick={() => setReasonWindow(value)} className={reasonWindow === value ? "active" : ""}>Top {value}</button>)}</div></div>
              <ReasonFrequencyChart data={review.reasonFrequency[reasonWindow]} />
            </article>
            <article className="review-chart-card"><div className="panel-heading"><span>Anomaly score by existing Risk Profile</span><small>Overlap is expected; profile labels do not define anomaly</small></div><AnomalyBoxplotChart data={review.scoreByRiskProfile} /></article>
          </div>
          <ReviewQueue candidates={review.candidates as ReviewCandidate[]} />
        </section>

        <section className="section" id="insights">
          <SectionHeader number="08" eyebrow="Synthesis" title="KEY INSIGHTS" />
          <div className="insights-list">{insightData.insights.map((item) => <article key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div>
        </section>

        <section className="takeaway">
          <p className="eyebrow">Portfolio takeaway</p>
          <h2>THE MODEL DIDN'T NEED MORE COMPLEXITY.<br /><span>THE TARGET NEEDED MORE SIGNAL.</span></h2>
          <div><p>The project demonstrates why model diagnostics matter. Higher model complexity, class weighting, and resampling could not overcome the weak relationship between available predictors and Risk Profile.</p><p>Instead of forcing a misleading classifier, the analysis pivoted toward customer segmentation, data-quality diagnostics, and anomaly-based review prioritization.</p></div>
        </section>

        <section className="section methodology" id="methodology">
          <SectionHeader number="09" eyebrow="Methodology" title="HOW THE ANALYSIS EVOLVED" />
          <div className="timeline">{["EDA", "Preprocessing", "Feature Engineering", "Baseline Classification", "Class Imbalance Analysis", "Experiment V2", "Target Shuffle Test", "Permutation Importance", "Anomaly Screening"].map((step, i, arr) => <div key={step}><span>{String(i + 1).padStart(2, "0")}</span><strong>{step}</strong>{i < arr.length - 1 && <ArrowRight />}</div>)}</div>
          <div className="method-grid">
            <article><Workflow size={24} /><h3>ABOUT THIS PROJECT</h3><p>This portfolio began as an insurance risk-profiling and customer-segmentation study. A second diagnostic experiment revisited the modeling assumptions and found that the available predictors provide little stable signal for the assigned labels.</p></article>
            <article><FileChartColumn size={24} /><h3>ANALYSIS SOURCES</h3><ul className="plain-list"><li>Original classification notebook</li><li>Original clustering notebook</li><li>Risk profiling presentation</li><li>RFM project report</li><li>Experiment V2 diagnostic outputs</li></ul></article>
            <article><SearchCheck size={24} /><h3>LIMITATIONS</h3><ul className="plain-list"><li>Risk Profile label provenance is not validated.</li><li>Permutation effects inherit a near-chance model.</li><li>RFM and V2 clusters use different feature spaces.</li><li>Anomaly candidates require domain review.</li></ul></article>
          </div>
          <div className="tech-row"><span>VITE</span><span>REACT</span><span>TYPESCRIPT</span><span>ECHARTS</span><span>PYTHON PREPROCESSING</span><span>GITHUB PAGES</span></div>
        </section>
      </main>

      <footer>
        <div><CheckCircle2 size={22} /><strong>DECISION-SUPPORT DISCLAIMER</strong></div>
        <p>This dashboard is an analytical portfolio demonstration. Predictions and anomaly scores should not be used as the sole basis for insurance eligibility, pricing, or adverse customer decisions.</p>
        <span>Insurance Risk Intelligence · Static analytical portfolio</span>
      </footer>
    </>
  );
}

export default App;
