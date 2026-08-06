(function applySavedTheme() {
  const storageKey = "partiuquadra:preferences";
  const defaults = {
    theme: "system",
    contrast: false,
    largeText: false,
    reduceMotion: false,
  };

  try {
    const preferences = {
      ...defaults,
      ...JSON.parse(localStorage.getItem(storageKey) || "{}"),
    };
    const root = document.documentElement;

    if (preferences.theme !== "system") root.dataset.theme = preferences.theme;
    if (preferences.contrast) root.dataset.contrast = "more";
    if (preferences.largeText) root.dataset.fontSize = "large";
    if (preferences.reduceMotion) root.dataset.motion = "reduce";
  } catch {
    // Preferências inválidas não devem impedir o carregamento da página.
  }
})();
