export interface ConnectionEndpoint {
  componentId: string;
  connectorId: string;
}

export interface Connection {
  id: string;
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
}
