import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/services/axios";

export default function OrganizationDashboard() {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    fetchOrg();
  }, [orgId]);

  const fetchOrg = async () => {
    const { data } = await api.get(`/organizations/${orgId}`);
    setOrganization(data);
  };

  if (!organization) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>{organization.name}</h1>
      <p>{organization.description}</p>
    </div>
  );
}
