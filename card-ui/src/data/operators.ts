export interface Operator {
  id: string;
  name: string;
  provider: string;
  description: string;
  categories: string;
  project?: string;
  logo?: string;
  createdAt: string;
  url: string;
}

export const operatorsData: Operator[] = [
  {
    id: 'elastic-cloud-eck',
    name: 'Elasticsearch (ECK) Operator',
    provider: 'Elastic',
    description: 'Elastic Cloud on Kubernetes (ECK) automates the deployment, provisioning, management, and orchestration of Elasticsearch, Kibana, APM Server, and Enterprise Search on Kubernetes.',
    categories: 'HTTP',
    project: 'project-a',
    logo: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blta96f599d291b21fc/5d082d93f8ca2b7f16683b31/logo-elastic-search-color-64.svg',
    createdAt: '2023-01-15',
    url: 'https://operatorhub.io/operator/elastic-cloud-eck',
  },
  {
    id: 'strimzi-kafka-operator',
    name: 'Strimzi Kafka Operator',
    provider: 'Red Hat',
    description: 'Strimzi provides a way to run an Apache Kafka cluster on Kubernetes or OpenShift in various deployment configurations.',
    categories: 'HTTP',
    project: 'project-b',
    logo: 'https://strimzi.io/images/strimzi-logo.png',
    createdAt: '2022-09-24',
    url: 'https://operatorhub.io/operator/strimzi-kafka-operator',
  },
];
