# Experiment V2 — Risk Profile Learnability & Diagnostic Analysis

## Scope
Experiment V2 was executed on `Insurance Data.xlsx` with **150,000 rows**. The supervised target `Risk Profile` is available for **142,500 rows**, while **7,500 rows** are unlabeled. Class counts are Low=85,428, Medium=42,678, High=14,394.

Supervised evaluation uses a stratified 80/20 split: **114,000 training rows** and **28,500 validation rows**. The main metric is **macro-F1 / balanced accuracy**, not raw accuracy, because the target is imbalanced.

## Main holdout results

| Model | Accuracy | Balanced Accuracy | Macro-F1 | Weighted F1 |
|---|---:|---:|---:|---:|
| Dummy majority | 0.5995 | 0.3333 | 0.2499 | 0.4494 |
| Dummy stratified | 0.4536 | 0.3254 | 0.3254 | 0.4541 |
| LightGBM core balanced | 0.3532 | 0.3415 | 0.3125 | 0.3837 |
| LightGBM full balanced | 0.3549 | 0.3315 | 0.3086 | 0.3855 |
| LightGBM full unweighted | 0.5995 | 0.3333 | 0.2499 | 0.4494 |
| SMOTENC + LightGBM core | 0.5993 | 0.3333 | 0.2499 | 0.4494 |


The unweighted LightGBM collapses to the majority class and exactly reproduces the ~59.95% majority-class accuracy. Class weighting makes predictions more distributed across classes, but does **not** produce reliable discriminative performance.

## Cross-validation vs shuffled-target null
The 3-fold LightGBM core model produced mean balanced accuracy **0.3325** and mean macro-F1 **0.2986**. The shuffled-target null experiment produced mean balanced accuracy **0.3330** and mean macro-F1 **0.3000**.

The real-label result is therefore essentially indistinguishable from the shuffled-label null. This is the strongest evidence in Experiment V2 that the available features contain little stable predictive signal for the assigned `Risk Profile` labels.

## Corrected imbalance experiment
The previous notebook created BorderlineSMOTE output but trained downstream models on the original `X_train/y_train`. Experiment V2 explicitly tested resampling on the training data only. Full SMOTENC on all 114,000 training rows exceeded the available runtime memory, so the corrected SMOTENC diagnostic was executed on a **45,000-row stratified training subsample**, producing 80,934 balanced rows (26,978 per class). It still returned balanced accuracy **0.3333** and macro-F1 **0.2499**, i.e. no meaningful improvement.

## Feature importance
Permutation importance was evaluated with repeated permutations on a held-out validation subsample. Even the largest mean macro-F1 drop is small and has substantial variation. The current top entry is `Policy_Duration_Days` with a mean drop of **0.0091 ± 0.0074**. Most remaining features are near zero or negative after permutation.

This means tree split/gain importance should not be interpreted as causal or business importance. The model can split on variables even when overall prediction remains at chance level.

## Alternative clustering check
A separate MiniBatch K-Means diagnostic on standardized numeric underwriting features gave silhouette scores between **0.0671** and **0.1124** for k=2..6, with Davies-Bouldin values between **2.0298** and **2.7379**. This alternative feature space also shows weak natural separation. It is not directly comparable to the original RFM clustering because the feature definitions differ.

## Manual-review anomaly screening
Isolation Forest was run on non-demographic underwriting-style numeric variables plus driving-record severity for all 150,000 rows. The output `manual_review_candidates_v2.csv` contains the top 100 anomalous records with a short explanation based on standardized unusual values.

**These records are not fraud labels.** They are manual-review candidates only. The highest-ranked candidates include CUST027362, CUST082162, CUST024565, CUST023592, and CUST125827.

## Conclusion
Experiment V2 does not support using this dataset to build a reliable supervised `Risk Profile` classifier. The majority-class accuracy is misleading, balanced metrics remain close to chance, cross-validation matches the shuffled-target null, and oversampling does not recover predictive signal. For a portfolio, the technically defensible story is a **target-learnability / model-diagnostics study**, followed by anomaly-based manual-review prioritization rather than claiming a high-performing underwriting classifier.
