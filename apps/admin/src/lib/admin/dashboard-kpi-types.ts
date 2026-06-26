export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};

export type DashboardKpiGroup = {
  name: string;
  color: string;
  description: string;
  metrics: DashboardMetric[];
};

export type AdminDashboardKpis = {
  groups: DashboardKpiGroup[];
};
