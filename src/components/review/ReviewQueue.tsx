import { useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";
import type { ReviewCandidate } from "../../types/dashboard";

const currency = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

type SortKey = "rank" | "anomalyScore" | "coverageAmount" | "premiumAmount" | "creditScore";

export function ReviewQueue({ candidates }: { candidates: ReviewCandidate[] }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [descending, setDescending] = useState(false);

  const visible = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      const matchesRisk = risk === "All" || candidate.riskProfile === risk;
      const haystack = `${candidate.maskedCustomerId} ${candidate.drivingRecord} ${candidate.reviewSignals.map((item) => item.label).join(" ")}`.toLowerCase();
      return matchesRisk && haystack.includes(query.toLowerCase());
    });
    return filtered.sort((a, b) => {
      const delta = a[sortKey] - b[sortKey];
      return descending ? -delta : delta;
    });
  }, [candidates, query, risk, sortKey, descending]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setDescending((value) => !value);
    else { setSortKey(key); setDescending(false); }
  }

  const header = (label: string, key?: SortKey) => key ? (
    <button className="table-sort" type="button" onClick={() => handleSort(key)} aria-label={`Sort by ${label}`}>
      {label}<ArrowDownUp size={13} aria-hidden="true" />
    </button>
  ) : label;

  return (
    <div className="review-table-shell">
      <div className="review-toolbar">
        <label className="search-control">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search review queue</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search masked ID or review signal" />
        </label>
        <label className="select-control">
          <span>Risk Profile</span>
          <select value={risk} onChange={(event) => setRisk(event.target.value)}>
            {['All', 'Low', 'Medium', 'High', 'Unlabeled'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <span className="result-count">{visible.length} candidates</span>
      </div>
      <div className="table-scroll" tabIndex={0} aria-label="Scrollable manual review candidates table">
        <table>
          <thead>
            <tr>
              <th>{header("Rank", "rank")}</th>
              <th>Masked customer</th>
              <th>Risk Profile</th>
              <th>{header("Anomaly score", "anomalyScore")}</th>
              <th>{header("Coverage", "coverageAmount")}</th>
              <th>{header("Premium", "premiumAmount")}</th>
              <th>Deductible</th>
              <th>Claims</th>
              <th>{header("Credit", "creditScore")}</th>
              <th>Policy days</th>
              <th>Driving record</th>
              <th>Primary review reasons</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((candidate) => (
              <tr key={candidate.rank}>
                <td className="rank-cell">#{String(candidate.rank).padStart(2, "0")}</td>
                <td><strong>{candidate.maskedCustomerId}</strong></td>
                <td><span className={`risk-label risk-label--${candidate.riskProfile.toLowerCase()}`}>{candidate.riskProfile}</span></td>
                <td><strong>{candidate.anomalyScore.toFixed(3)}</strong></td>
                <td>{currency.format(candidate.coverageAmount)}</td>
                <td>{currency.format(candidate.premiumAmount)}</td>
                <td>{currency.format(candidate.deductible)}</td>
                <td>{candidate.previousClaims}</td>
                <td>{candidate.creditScore}</td>
                <td>{currency.format(candidate.policyDuration)}</td>
                <td>{candidate.drivingRecord}</td>
                <td className="reasons-cell">{candidate.reviewSignals.map((signal) => signal.label).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
