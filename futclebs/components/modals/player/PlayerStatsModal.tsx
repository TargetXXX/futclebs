import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Modal, Progress, Row, Statistic, Tag, Typography } from 'antd';
import { api, PlayerStats } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats | null;
  playerName: string;
  playerId: string;
  isGoalkeeper: boolean;
  onViewMatchSummary: (mid: string) => void;
}

const { Text } = Typography;

export const PlayerStatsModal: React.FC<Props> = ({ isOpen, onClose, stats, playerName, isGoalkeeper }) => {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      const orgId = localStorage.getItem('orgId');
      if (!orgId) return;
      const { data } = await api.get(`/organizations/${orgId}/tournaments`);
      const flat = (data?.data || data || []).flatMap((t: any) => t.matches || []);
      setMatches(flat);
    };
    load();
  }, [isOpen]);

  const visibleStats = useMemo(
    () => [
      { label: 'Velocidade', value: stats?.velocidade ?? 0 },
      { label: 'Finalização', value: stats?.finalizacao ?? 0 },
      { label: 'Passe', value: stats?.passe ?? 0 },
      { label: 'Drible', value: stats?.drible ?? 0 },
      { label: 'Defesa', value: stats?.defesa ?? 0 },
      { label: 'Físico', value: stats?.fisico ?? 0 },
      { label: 'Esportividade', value: stats?.esportividade ?? 0 },
    ].filter((item) => !isGoalkeeper || ['Passe', 'Defesa', 'Esportividade'].includes(item.label)),
    [stats, isGoalkeeper],
  );

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={860}
      title={<span className="text-white font-black">{playerName} • Painel completo</span>}
    >
      <Row gutter={[14, 14]}>
        <Col xs={24} md={8}>
          <Card className="dashboard-glow !rounded-2xl">
            <Statistic title="Overall" value={stats?.overall || 0} valueStyle={{ color: '#34d399', fontWeight: 800 }} />
            <div className="mt-3">
              <Tag color={isGoalkeeper ? 'gold' : 'blue'}>{isGoalkeeper ? 'Goleiro' : 'Jogador de linha'}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-glow !rounded-2xl">
            <Statistic title="Partidas mapeadas" value={matches.length} valueStyle={{ color: '#7dd3fc', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-glow !rounded-2xl">
            <Text className="!text-slate-300">Perfil de performance</Text>
            <Progress percent={Math.min((stats?.overall || 0), 100)} showInfo={false} strokeColor="#22d3ee" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} className="mt-2">
        {visibleStats.map((item) => (
          <Col xs={24} md={12} key={item.label}>
            <Card size="small" className="dashboard-glow !rounded-xl">
              <div className="flex items-center justify-between mb-1 text-xs uppercase text-slate-300">
                <span>{item.label}</span>
                <span className="font-bold text-emerald-300">{item.value}</span>
              </div>
              <Progress
                percent={Math.min(item.value * 20, 100)}
                showInfo={false}
                strokeColor={{ from: '#34d399', to: '#22d3ee' }}
                trailColor="#1e293b"
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mt-5 text-right">
        <Button onClick={onClose} className="!rounded-xl" type="primary">
          Fechar
        </Button>
      </div>
    </Modal>
  );
};
