import { useState, useEffect } from "react";

interface DomainAlert {
  domain: string;
  minutes: number;
}

const STORAGE_KEY = "domainAlertSettings";

export default function DomainAlertSettings() {
  const [alerts, setAlerts] = useState<DomainAlert[]>([]);
  const [domain, setDomain] = useState("");
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const addAlert = () => {
    if (!domain || minutes <= 0) return;
    setAlerts((prev) => [...prev, { domain, minutes }]);
    setDomain("");
    setMinutes(30);
  };

  const removeAlert = (idx: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>도메인별 알림 설정</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="도메인 (예: youtube.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          style={{ width: 80 }}
        />
        <span>분</span>
        <button onClick={addAlert}>추가</button>
      </div>
      <ul>
        {alerts.map((a, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{a.domain}</span>
            <span>{a.minutes}분</span>
            <button onClick={() => removeAlert(i)}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
