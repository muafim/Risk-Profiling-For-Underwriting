# Insurance Risk Intelligence

## Overview

Insurance Risk Intelligence is a static portfolio dashboard that turns an insurance classification and customer-segmentation study into a responsible model-diagnostics story. It explains why a seemingly strong 59.95% accuracy result is only the majority-class baseline, tests whether the assigned target is learnable, and pivots toward exploratory segmentation and human review prioritization.

The dashboard is a visualization layer. It does not run machine-learning models in the browser and is not a production underwriting engine.

## Problem Statement

The original project attempted to classify customers into Low, Medium, and High Risk Profile groups. Because Low Risk represents nearly 60% of labeled records, raw accuracy can reward a model that predicts the majority class for nearly everyone. The central analytical question therefore became: **do the available predictors contain stable information that can distinguish the three assigned labels?**

## Dataset

- 150,000 customer records
- 142,500 labeled Risk Profile records
- 7,500 unlabeled records
- Low: 85,428 (59.95% of labeled records)
- Medium: 42,678 (29.95%)
- High: 14,394 (10.10%)

The raw workbook is used only by the preprocessing script and is excluded from the public build.

## Original Analysis

The first study covered data understanding, preprocessing, feature engineering, classification, and evaluation. Engineered fields included premium-to-coverage ratio, deductible-to-coverage ratio, premium-to-age ratio, an age-credit interaction, policy duration, and policy start date fields.

The original Random Forest holdout result reached approximately 60% accuracy while recalling virtually all Low Risk records and almost none of the Medium or High Risk records. A distinct stratified/random experiment distributed predictions more evenly and returned approximately 33% accuracy.

## Why Accuracy Was Misleading

Low Risk represents 59.95% of the labeled dataset. A dummy model that labels every record Low therefore obtains 59.95% accuracy without learning useful class boundaries. Balanced accuracy, Macro-F1, per-class recall, and target-shuffle tests are more informative for this case.

## Experiment V2

Experiment V2 compares dummy baselines, balanced and unweighted LightGBM variants, and corrected SMOTENC training. The highest observed holdout balanced accuracy is 34.15%, only marginally above the one-third reference for average recall across three classes.

## Model Diagnostics

- Unweighted LightGBM reproduces the majority-class result.
- Balanced models spread predictions across classes but remain close to chance-level discrimination.
- Corrected SMOTENC does not materially improve balanced accuracy or Macro-F1.
- Real-label cross-validation is effectively indistinguishable from shuffled-label validation.

## Target Learnability

Three-fold LightGBM cross-validation returns 0.3325 balanced accuracy on real labels and 0.3330 after labels are shuffled. Macro-F1 is 0.2986 on real labels and 0.3000 on shuffled labels. The available feature-target relationship is therefore weak and unstable.

## Feature Importance

The dashboard defaults to permutation importance using mean Macro-F1 decrease and its permutation standard deviation. The leading entry, Policy Duration Days, produces only a 0.0091 ± 0.0074 reduction. Model gain is available as a secondary view but is explicitly not presented as causal or reliable underwriting importance.

## Customer Segmentation

The original RFM work is presented as a separate exploratory objective:

- RFM combination 1: policy-renewal recency, customer tenure, and total premium; k=4, silhouette 0.2752, Davies-Bouldin 1.1698.
- RFM combination 2: policy-renewal recency, previous claims count, and total premium; k=3, silhouette 0.2643, Davies-Bouldin 1.3504.
- V2 numeric clustering diagnostic: best silhouette 0.1124 in a different feature space.

These results support exploration but show substantial cluster overlap.

## Manual Review Screening

Isolation Forest output is presented as a 100-record manual review queue. Full customer IDs are removed during preprocessing. Each published candidate contains only a masked identifier, a review score, selected underwriting attributes, and unusual-feature explanations.

Anomaly detection identifies unusual records, not confirmed fraud.

## Key Insights

1. Class imbalance makes raw accuracy misleading.
2. Balanced model performance remains near the three-class reference.
3. Shuffled labels perform almost identically to real labels.
4. Correcting the oversampling workflow does not recover predictive signal.
5. Feature importance effects are small and uncertain.
6. Customer clusters are weakly separated.
7. Anomaly ranking can still support human review when treated as a screening tool.

## Dashboard Features

- Editorial, magazine-style responsive layout
- Stacked class-distribution visualization
- Grouped model metric comparison with a one-third reference line
- Real-label versus shuffled-label paired comparison
- Permutation importance with uncertainty and model-gain toggle
- RFM clustering quality comparison
- Manual review reason aggregation for the top 20, 50, or 100 records
- Anomaly score boxplots by assigned Risk Profile
- Searchable, filterable, sortable privacy-masked review queue
- Accessible headings, focus states, persistent chart annotations, and reduced-motion support

## Tech Stack

- Vite
- React
- TypeScript
- Apache ECharts and echarts-for-react
- Lucide React
- Python and pandas for offline preprocessing
- GitHub Actions and GitHub Pages

## Project Structure

```text
.
├── .github/workflows/deploy.yml
├── scripts/prepare-dashboard-data.py
├── src/
│   ├── components/
│   │   ├── charts/DashboardCharts.tsx
│   │   ├── editorial/SectionHeader.tsx
│   │   └── review/ReviewQueue.tsx
│   ├── data/*.json
│   ├── types/dashboard.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Running Locally

```bash
npm ci
npm run dev
```

Create a production build and preview it locally:

```bash
npm run build
npm run preview
```

## Data Preprocessing

The committed `src/data/*.json` files are sufficient to build and deploy the dashboard. To regenerate them locally, place the expected raw sources at the repository root and run:

```bash
python scripts/prepare-dashboard-data.py
```

The script reads the Excel workbook and three diagnostic CSVs, validates the core counts and metrics, aggregates review reasons, calculates anomaly-score summaries, masks customer identifiers, and writes eight compact JSON files. The frontend never loads the 150,000-row workbook.

## GitHub Pages Deployment

The Vite base is relative (`./`) so assets resolve correctly on repository subpaths. The included workflow installs dependencies with `npm ci`, runs the production build, uploads `dist`, and deploys it through GitHub Pages.

In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Limitations

- The provenance and business construction of the Risk Profile label require further validation.
- A near-chance model limits how strongly any feature ranking can be interpreted.
- Original RFM and V2 clustering diagnostics use different feature spaces.
- RFM segments are exploratory and are not validated causal customer types.
- The anomaly queue contains unusual records, not fraud labels or automated decision recommendations.
- The dashboard summarizes completed experiments and does not retrain models in-browser.

## Responsible Use

This dashboard is an analytical portfolio demonstration. Predictions and anomaly scores should not be used as the sole basis for insurance eligibility, pricing, or adverse customer decisions. Domain review, label validation, data-governance controls, fairness testing, and independent model validation would be required before operational use.
