import { api } from "@/services/axios";
import { useEffect, useState } from "react";

export default function JoinOrganization() {
  const [organizations, setOrganizations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const result = organizations.filter((org) =>
      org.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, organizations]);

  const fetchAll = async () => {
    const { data } = await api.get("/organizations");
    setOrganizations(data);
    setFiltered(data);
  };

  const handleJoin = async () => {
    try {
      await api.post(`/me/organizations/${selectedOrg.id}/join`, {
        password,
      });

      alert("Entrou com sucesso!");
      setSelectedOrg(null);
      setPassword("");
    } catch (error) {
      alert("Senha incorreta");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Entrar em Organização</h1>

      <input
        placeholder="Pesquisar organização..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        {filtered.map((org) => (
          <div
            key={org.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
            }}
            onClick={() => setSelectedOrg(org)}
          >
            {org.name}
          </div>
        ))}
      </div>

      {selectedOrg && (
        <div style={{ marginTop: 30 }}>
          <h3>Entrar em: {selectedOrg.name}</h3>

          <input
            type="password"
            placeholder="Senha da organização"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleJoin}>Entrar</button>
        </div>
      )}
    </div>
  );
}
