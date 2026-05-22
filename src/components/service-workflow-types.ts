export type ServiceWorkflowStepConfig = {
  title: string;
  description: string;
  image: string;
};

export type ServiceWorkflowPillarKey = "palette" | "bolt" | "shield";

export type ServiceWorkflowConfig = {
  markerStep: string;
  processLabel: string;
  titleWhite: string;
  titleAccent: string;
  stepsSubtitle: string;
  description: string;
  stripTitle: string;
  defaultStepIndex: number;
  steps: ServiceWorkflowStepConfig[];
  pillars: Array<{
    title: string;
    body: string;
    icon: ServiceWorkflowPillarKey;
  }>;
};
