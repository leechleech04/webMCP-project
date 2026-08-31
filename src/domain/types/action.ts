export interface InstallComponentAction {
  type: "INSTALL_COMPONENT";
  componentId: string;
  mountId: string;
}

export interface RemoveComponentAction {
  type: "REMOVE_COMPONENT";
  componentId: string;
}

export interface MoveComponentAction {
  type: "MOVE_COMPONENT";
  componentId: string;
  mountId: string;
}

export interface ConnectComponentsAction {
  type: "CONNECT_COMPONENTS";
  fromComponentId: string;
  fromConnectorId: string;
  toComponentId: string;
  toConnectorId: string;
}

export interface DisconnectComponentsAction {
  type: "DISCONNECT_COMPONENTS";
  connectionId: string;
}

export interface SetFanDirectionAction {
  type: "SET_FAN_DIRECTION";
  componentId: string;
  direction: "INTAKE" | "EXHAUST";
}

export type DomainAction =
  | InstallComponentAction
  | RemoveComponentAction
  | MoveComponentAction
  | ConnectComponentsAction
  | DisconnectComponentsAction
  | SetFanDirectionAction;
