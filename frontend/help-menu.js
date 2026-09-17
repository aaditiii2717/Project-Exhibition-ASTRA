// Help menu (the "Help ↓" dropdown in Mission Control's top bar): toggle state
// and the two actions it exposes, Demo guide and Method.
function getHelpMenuProps(component, state) {
  return {
    helpOpen: state.helpOpen,
    onToggleHelp: () => component.setState({ helpOpen: !state.helpOpen }),
    onOpenGuide: () => component.setState({ helpOpen: false, dialogOpen: "guide" }),
    onOpenMethod: () => component.setState({ helpOpen: false, dialogOpen: "method" })
  };
}
