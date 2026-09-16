from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)

RISK_ORDER = ["Low", "Medium", "High"]
RISK_COLORS = {"Low": "#2563EB", "Medium": "#D97706", "High": "#C62828"}


def clean(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return None if not math.isfinite(float(value)) else float(value)
    if pd.isna(value):
        return None
    return value


def write_json(name: str, payload) -> None:
    (OUT / name).write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, default=clean) + "\n",
        encoding="utf-8",
    )


def mask_customer_id(value: str) -> str:
    value = str(value)
    if len(value) <= 4:
        return "••" + value[-2:]
    prefix = re.match(r"^[A-Za-z]+", value)
    return f"{prefix.group(0) if prefix else value[:2]}••{value[-4:]}"


def pretty_feature(name: str) -> str:
    mapping = {
        "Premium_Coverage_Ratio": "Premium / Coverage Ratio",
        "Deductible_Coverage_Ratio": "Deductible / Coverage Ratio",
        "Policy_Duration_Days": "Policy Duration",
        "Previous Claims History": "Previous Claims",
    }
    return mapping.get(name, name.replace("_", " "))


def parse_review_features(text: str) -> list[dict]:
    items = []
    for chunk in str(text).split(";"):
        chunk = chunk.strip()
        match = re.match(r"(.+?) \((high|low), z=([-0-9.]+)\)$", chunk)
        if match:
            raw, direction, z = match.groups()
            items.append(
                {
                    "feature": pretty_feature(raw),
                    "rawFeature": raw,
                    "direction": direction,
                    "zScore": float(z),
                    "label": f"{pretty_feature(raw)} unusually {direction}",
                }
            )
        elif chunk:
            items.append({"feature": pretty_feature(chunk), "rawFeature": chunk, "label": chunk})
    return items


def box_summary(values: pd.Series) -> dict:
    values = values.dropna().astype(float)
    if values.empty:
        return {"count": 0, "min": None, "q1": None, "median": None, "q3": None, "max": None}
    return {
        "count": int(values.size),
        "min": float(values.min()),
        "q1": float(values.quantile(0.25)),
        "median": float(values.median()),
        "q3": float(values.quantile(0.75)),
        "max": float(values.max()),
    }


def main() -> None:
    raw = pd.read_excel(ROOT / "Insurance Data.xlsx", sheet_name="Insurance Data 150k")
    metrics = pd.read_csv(ROOT / "model_metrics_v2_final.csv")
    importance = pd.read_csv(ROOT / "feature_importance_lightgbm_full.csv")
    review = pd.read_csv(ROOT / "manual_review_candidates_v2.csv")

    total = int(len(raw))
    labeled = int(raw["Risk Profile"].notna().sum())
    unlabeled = total - labeled
    counts = raw["Risk Profile"].value_counts()
    classes = [
        {
            "label": label,
            "count": int(counts.get(label, 0)),
            "share": float(counts.get(label, 0) / labeled),
            "color": RISK_COLORS[label],
        }
        for label in RISK_ORDER
    ]
    majority = max(classes, key=lambda item: item["count"])

    numeric_cols = raw.select_dtypes(include="number").columns.tolist()
    encoded_risk = raw["Risk Profile"].map({"Low": 0, "Medium": 1, "High": 2})
    correlations = []
    for col in numeric_cols:
        corr = raw[col].corr(encoded_risk)
        if pd.notna(corr):
            correlations.append({"feature": col, "correlation": float(corr)})
    correlations.sort(key=lambda item: abs(item["correlation"]), reverse=True)

    write_json(
        "dataset-summary.json",
        {
            "totalRecords": total,
            "labeledRecords": labeled,
            "unlabeledRecords": unlabeled,
            "riskClasses": classes,
            "majorityClass": majority,
            "featureCount": int(raw.shape[1] - 1),
            "topNumericCorrelations": correlations[:8],
            "sourceSheet": "Insurance Data 150k",
        },
    )

    write_json(
        "original-analysis.json",
        {
            "workflow": ["Data Understanding", "Preprocessing", "Feature Engineering", "Classification", "Evaluation"],
            "engineeredFeatures": [
                "Premium / Coverage Ratio",
                "Deductible / Coverage Ratio",
                "Premium / Age Ratio",
                "Age × Credit Score",
                "Policy Duration",
                "Policy Start Year / Month",
            ],
            "experiments": [
                {
                    "name": "Random Forest majority-collapse",
                    "accuracy": 0.60,
                    "macroF1": 0.25,
                    "recall": {"Low": 1.00, "Medium": 0.00, "High": 0.00},
                    "interpretation": "The model predicts almost every validation record as Low Risk.",
                },
                {
                    "name": "Random Forest stratified/random",
                    "accuracy": 0.33,
                    "macroF1": 0.33,
                    "recall": {"Low": 0.35, "Medium": 0.34, "High": 0.31},
                    "interpretation": "More even class predictions reduce accuracy to roughly one-third.",
                },
            ],
            "eda": {
                "headline": "Feature distributions show weak class separation and limited discriminatory signal.",
                "points": [
                    "Numerical distributions are broadly symmetric in the supplied study.",
                    "Assigned risk groups overlap heavily across available predictors.",
                    "Numerical correlations with the encoded target are extremely small.",
                    "Categorical variables provide little visible separation.",
                ],
                "maxAbsoluteNumericCorrelation": float(max(abs(item["correlation"]) for item in correlations)),
            },
        },
    )

    metric_rows = [
        {key: clean(value) for key, value in row.items()}
        for row in metrics.sort_values("macro_f1", ascending=False).to_dict("records")
    ]
    highest_balanced = metrics.loc[metrics["balanced_accuracy"].idxmax()]
    write_json(
        "model-comparison.json",
        {
            "models": metric_rows,
            "referenceBalancedAccuracy": 1 / 3,
            "highestObservedBalancedAccuracy": {
                "model": highest_balanced["model"],
                "value": float(highest_balanced["balanced_accuracy"]),
                "distanceFromReference": float(highest_balanced["balanced_accuracy"] - 1 / 3),
            },
        },
    )

    write_json(
        "experiment-v2.json",
        {
            "shuffleTest": [
                {"metric": "Balanced Accuracy", "real": 0.3325, "shuffled": 0.3330},
                {"metric": "Macro-F1", "real": 0.2986, "shuffled": 0.3000},
            ],
            "smotenc": {
                "trainingSubsample": 45000,
                "balancedRows": 80934,
                "rowsPerClass": 26978,
                "balancedAccuracy": float(metrics.loc[metrics["model"] == "SMOTENC + LightGBM core", "balanced_accuracy"].iloc[0]),
                "macroF1": float(metrics.loc[metrics["model"] == "SMOTENC + LightGBM core", "macro_f1"].iloc[0]),
                "originalIssue": "BorderlineSMOTE output was created, but downstream models used the original training arrays.",
            },
            "verdict": "The available predictors do not provide enough stable information to reliably distinguish Low, Medium, and High Risk Profile labels.",
            "clusteringDiagnostic": {
                "method": "MiniBatch K-Means on standardized numeric underwriting features",
                "silhouetteRange": [0.0671, 0.1124],
                "bestSilhouette": 0.1124,
                "daviesBouldinRange": [2.0298, 2.7379],
            },
        },
    )

    importance_rows = importance.copy()
    importance_rows["label"] = importance_rows["feature"].map(pretty_feature)
    perm = importance_rows.sort_values("permutation_macro_f1_drop_mean", ascending=False).head(10)
    gain = importance_rows.sort_values("gain", ascending=False).head(10)
    write_json(
        "feature-importance.json",
        {
            "permutation": [{key: clean(value) for key, value in row.items()} for row in perm.to_dict("records")],
            "gain": [{key: clean(value) for key, value in row.items()} for row in gain.to_dict("records")],
            "disclaimer": "A feature appearing at the top of this ranking does not mean it is a strong underwriting risk driver. Overall model discrimination remains near chance level.",
        },
    )

    write_json(
        "clustering-summary.json",
        {
            "combinations": [
                {
                    "name": "Original RFM 1",
                    "k": 4,
                    "silhouette": 0.2752,
                    "daviesBouldin": 1.1698,
                    "recency": "Time since last policy renewal",
                    "frequency": "Policy duration / customer tenure",
                    "monetary": "Total premium",
                    "supports": ["Customer tenure", "Premium contribution", "Retention potential", "Loyalty", "Upselling opportunities"],
                },
                {
                    "name": "Original RFM 2",
                    "k": 3,
                    "silhouette": 0.2643,
                    "daviesBouldin": 1.3504,
                    "recency": "Time since last policy renewal",
                    "frequency": "Previous claims count",
                    "monetary": "Total premium",
                    "supports": ["Claim activity", "Portfolio utilization", "Risk monitoring", "Customer education"],
                },
                {
                    "name": "V2 numeric diagnostic",
                    "k": None,
                    "silhouette": 0.1124,
                    "daviesBouldin": 2.0298,
                    "differentFeatureSpace": True,
                },
            ],
            "comparisonNote": "The V2 numeric clustering diagnostic uses a different feature space and is shown only as a consistency check.",
        },
    )

    review_rows = []
    parsed_features = []
    for _, row in review.iterrows():
        features = parse_review_features(row["top_unusual_features"])
        parsed_features.append(features)
        review_rows.append(
            {
                "rank": int(row["rank"]),
                "maskedCustomerId": mask_customer_id(row["Customer ID"]),
                "riskProfile": row["Risk Profile"] if pd.notna(row["Risk Profile"]) else "Unlabeled",
                "anomalyScore": float(row["anomaly_score"]),
                "coverageAmount": float(row["Coverage Amount"]),
                "premiumAmount": float(row["Premium Amount"]),
                "deductible": float(row["Deductible"]),
                "previousClaims": int(row["Previous Claims History"]),
                "creditScore": int(row["Credit Score"]),
                "policyDuration": int(row["Policy_Duration_Days"]),
                "drivingRecord": row["Driving Record"],
                "reviewSignals": features,
            }
        )

    reason_windows = {}
    for limit in [20, 50, 100]:
        counter = Counter(item["feature"] for features in parsed_features[:limit] for item in features)
        reason_windows[str(limit)] = [
            {"feature": feature, "count": count} for feature, count in counter.most_common()
        ]

    score_boxes = []
    for label in ["Low", "Medium", "High", "Unlabeled"]:
        mask = review["Risk Profile"].fillna("Unlabeled") == label
        score_boxes.append({"riskProfile": label, **box_summary(review.loc[mask, "anomaly_score"])})

    write_json(
        "review-candidates.json",
        {
            "candidateCount": int(len(review_rows)),
            "candidates": review_rows,
            "reasonFrequency": reason_windows,
            "scoreByRiskProfile": score_boxes,
            "disclosure": "Anomaly detection identifies unusual records, not confirmed fraud.",
        },
    )

    best_importance = perm.iloc[0]
    write_json(
        "dashboard-insights.json",
        {
            "insights": [
                {"number": "01", "title": "Class imbalance distorts accuracy", "body": f"{majority['share']:.2%} of labeled records are {majority['label']} Risk, so majority-only prediction reaches the same accuracy."},
                {"number": "02", "title": "Balanced performance stays near chance", "body": f"The highest observed balanced accuracy is {highest_balanced['balanced_accuracy']:.2%}, only {(highest_balanced['balanced_accuracy'] - 1/3):.2%} above the three-class reference."},
                {"number": "03", "title": "Shuffled labels perform almost identically", "body": "Real-label and shuffled-target three-fold validation differ by less than two-tenths of a percentage point."},
                {"number": "04", "title": "Oversampling does not recover signal", "body": "Corrected SMOTENC still returns approximately one-third balanced accuracy."},
                {"number": "05", "title": "Feature importance is weak and uncertain", "body": f"The largest permutation effect is only {best_importance['permutation_macro_f1_drop_mean']:.4f} ± {best_importance['permutation_std']:.4f} macro-F1."},
                {"number": "06", "title": "Customer clusters overlap", "body": "Both original RFM variants have silhouette scores below 0.28, and the V2 numeric diagnostic is weaker."},
                {"number": "07", "title": "Anomaly screening still supports review", "body": f"{len(review_rows)} unusual profiles are ranked for human inspection without treating anomaly as fraud."},
            ]
        },
    )

    print(f"Generated 8 dashboard JSON files in {OUT}")


if __name__ == "__main__":
    main()
