// Only the observed Expo Go tutorial may be dismissed; never accept arbitrary dialogs.
export function onboardingAction(nodes, tutorialDismissed = false) {
  const expo = nodes.filter(node => node.bundleId === 'host.exp.exponent');
  const tutorial = expo.some(node => node.label === 'This is the developer menu. It gives you access to useful tools in your development builds.');
  const menu = tutorialDismissed && expo.some(node => node.label === 'SDK version: 57.0.0');
  const label = tutorial ? 'Continue' : menu ? 'Close' : null;
  const button = label && expo.find(node => node.label === label && node.enabled);
  return button?.rect ? { rect: button.rect, tutorial } : null;
}
