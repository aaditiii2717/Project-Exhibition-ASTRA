// Mission Control's top header bar: breadcrumb title, data-source pill,
// live UTC clock, the Operator/Forensic mode toggle, and the "Import
// telemetry" action. (The Help dropdown itself lives in help-menu.js.)
function getHeaderProps(component, state, view) {
  return {
    pageTitle: component.titleFor(view),
    sourceLabel: state.sourceLabel,
    connectionColor: state.connectionColor,
    utcLabel: state.utcLabel,
    operatorModeStyle: `height:24px;padding:0 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;font-family:inherit;background:${state.mode === "operator" ? "#5795f5" : "transparent"};color:${state.mode === "operator" ? "#030609" : "#71858f"}`,
    forensicModeStyle: `height:24px;padding:0 10px;border-radius:14px;border:none;font-size:12px;cursor:pointer;font-family:inherit;background:${state.mode === "forensic" ? "#5795f5" : "transparent"};color:${state.mode === "forensic" ? "#030609" : "#71858f"}`,
    onSetOperatorMode: () => component.setState({ mode: "operator" }),
    onSetForensicMode: () => component.setState({ mode: "forensic" }),
    onOpenImport: () => component.setState({ dialogOpen: "import" })
  };
}
