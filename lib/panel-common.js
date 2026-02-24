/**
 * Panel Common - Shared JavaScript for all panel layouts
 * Contains common functionality used by panel-a, panel-b, and panel-c
 */

// ═══════════════════════════════════════════════════════════
//  COLOR PICKER - Shared across all layouts
// ═══════════════════════════════════════════════════════════

// Color marker state (referenced by cssEditorCM from each panel.js)
let colorMarkers = [];
let isUpdatingMarkers = false;
let markerUpdateTimeout = null;
let currentColorMark = null;

// Comprehensive COLOR_REGEX supporting all modern CSS color formats
const COLOR_REGEX = new RegExp([
  // Hex colors: #rgb, #rrggbb, #rrggbbaa
  '#[0-9a-fA-F]{3,8}\\b',
  // RGB/RGBA - comma-separated (legacy)
  'rgba?\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*(?:,\\s*[\\d.]+\\s*)?\\)',
  // RGB/RGBA - space-separated with optional percentages and slash alpha (modern)
  'rgba?\\(\\s*\\d+%?\\s+\\d+%?\\s+\\d+%?\\s*(?:\\/\\s*[\\d.]+%?\\s*)?\\)',
  // HSL/HSLA - comma-separated (legacy)
  'hsla?\\(\\s*\\d+\\s*,\\s*[\\d.]+%\\s*,\\s*[\\d.]+%\\s*(?:,\\s*[\\d.]+\\s*)?\\)',
  // HSL/HSLA - space-separated with slash alpha (modern)
  'hsla?\\(\\s*\\d+\\s+[\\d.]+%\\s+[\\d.]+%\\s*(?:\\/\\s*[\\d.]+%?\\s*)?\\)',
  // Named colors: red, blue, green, etc.
  '\\b(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey|cyan|magenta|lime|maroon|navy|olive|teal|aqua|fuchsia|silver|gold|coral|crimson|indigo|violet|turquoise|salmon|tan|khaki|plum|peru|sienna|tomato|snow|ivory|azure|beige|bisque|wheat|linen|mint|lavender|orchid|thistle)\\b'
].join('|'), 'gi');

/**
 * Add color preview markers to CSS editor
 * IMPORTANT: Requires cssEditorCM to be defined in the calling context
 */
function addColorMarkers() {
  if (!cssEditorCM || isUpdatingMarkers) return;
  isUpdatingMarkers = true;

  try {
    // Clear all existing markers
    colorMarkers.forEach(marker => {
      try { marker.clear(); } catch (e) {}
    });
    colorMarkers = [];

    const lineCount = cssEditorCM.lineCount();
    console.log(`🔍 Scanning ${lineCount} lines for colors...`);

    for (let i = 0; i < lineCount; i++) {
      const line = cssEditorCM.getLine(i);
      if (!line) continue;

      COLOR_REGEX.lastIndex = 0;
      let match;

      while ((match = COLOR_REGEX.exec(line)) !== null) {
        const colorValue = match[0];
        const startCh = match.index;
        const endCh = startCh + colorValue.length;

        const colorBox = document.createElement('span');
        colorBox.className = 'color-preview-marker';
        colorBox.style.backgroundColor = colorValue;
        colorBox.style.width = '14px';
        colorBox.style.height = '14px';
        colorBox.style.display = 'inline-block';
        colorBox.style.marginRight = '4px';
        colorBox.title = `Click to change: ${colorValue}`;

        console.log(`📍 Creating color marker for "${colorValue}" at line ${i}, position ${startCh}`);

        // Store data on element
        colorBox.dataset.line = i;
        colorBox.dataset.start = startCh;
        colorBox.dataset.end = endCh;
        colorBox.dataset.color = colorValue;

        // Single click handler (no memory leaks)
        colorBox.onclick = function(e) {
          e.stopPropagation();
          const line = parseInt(this.dataset.line);
          const start = parseInt(this.dataset.start);
          const end = parseInt(this.dataset.end);
          const color = this.dataset.color;
          openColorPicker(line, start, end, color, this);
        };

        // Use setBookmark instead of markText for better widget insertion
        const marker = cssEditorCM.setBookmark(
          { line: i, ch: startCh },
          {
            widget: colorBox,
            insertLeft: true,
            handleMouseEvents: true
          }
        );

        colorMarkers.push(marker);
      }
    }

    console.log(`✨ Created ${colorMarkers.length} color markers`);
  } finally {
    isUpdatingMarkers = false;
  }
}

/**
 * Convert various color formats to hex for the color picker
 */
function colorToHex(colorStr) {
  colorStr = colorStr.trim();

  // Already hex
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 4) {
      return '#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3];
    }
    return colorStr.substring(0, 7);
  }

  // Named colors: use browser's built-in color parsing
  if (!colorStr.startsWith('rgb') && !colorStr.startsWith('hsl') && !colorStr.includes('(')) {
    const tempEl = document.createElement('div');
    tempEl.style.color = colorStr;
    document.body.appendChild(tempEl);
    const computed = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }

  // RGB/RGBA - comma-separated (legacy)
  const rgbCommaMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbCommaMatch) {
    const r = parseInt(rgbCommaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbCommaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbCommaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // RGB/RGBA - space-separated (modern)
  const rgbSpaceMatch = colorStr.match(/rgba?\(\s*(\d+)%?\s+(\d+)%?\s+(\d+)%?\s*(?:\/.*)?/i);
  if (rgbSpaceMatch) {
    let r = parseInt(rgbSpaceMatch[1]);
    let g = parseInt(rgbSpaceMatch[2]);
    let b = parseInt(rgbSpaceMatch[3]);
    if (colorStr.includes('%')) {
      r = Math.round(r * 255 / 100);
      g = Math.round(g * 255 / 100);
      b = Math.round(b * 255 / 100);
    }
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // HSL/HSLA - both comma and space-separated
  const hslMatch = colorStr.match(/hsla?\(\s*(\d+)\s*[,\s]+\s*([\d.]+)%\s*[,\s]+\s*([\d.]+)%/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return '#000000';
}

/**
 * Open color picker popup at widget location
 */
function openColorPicker(line, startCh, endCh, currentColor, widget) {
  const colorPickerPopup = document.getElementById('colorPickerPopup');
  const colorPickerInput = document.getElementById('colorPickerInput');
  const colorPickerHexInput = document.getElementById('colorPickerHexInput');
  const colorPickerAlpha = document.getElementById('colorPickerAlpha');
  const colorPickerAlphaValue = document.getElementById('colorPickerAlphaValue');

  if (!colorPickerPopup || !colorPickerInput || !colorPickerHexInput) return;

  // Extract alpha from current color
  let alpha = 1.0;
  const lowerColor = currentColor.toLowerCase().trim();

  if (lowerColor.startsWith('rgba')) {
    const match = lowerColor.match(/rgba\s*\(\s*[\d.]+%?\s*[,\s]+\s*[\d.]+%?\s*[,\s]+\s*[\d.]+%?\s*[,\/]\s*([\d.]+)%?\s*\)/);
    if (match) {
      alpha = parseFloat(match[1]);
      if (match[1].includes('%')) alpha = alpha / 100;
    }
  } else if (lowerColor.startsWith('hsla')) {
    const match = lowerColor.match(/hsla\s*\(\s*[\d.]+\s*[,\s]+\s*[\d.]+%\s*[,\s]+\s*[\d.]+%\s*[,\/]\s*([\d.]+)%?\s*\)/);
    if (match) {
      alpha = parseFloat(match[1]);
      if (match[1].includes('%')) alpha = alpha / 100;
    }
  } else if (lowerColor.startsWith('#') && lowerColor.length === 9) {
    // 8-digit hex: #rrggbbaa
    alpha = parseInt(lowerColor.substring(7, 9), 16) / 255;
  }

  // Store reference to the marker being edited
  currentColorMark = { line, startCh, endCh, originalColor: currentColor, widget };

  // Convert color to hex using comprehensive function
  const hexColor = colorToHex(currentColor);

  colorPickerInput.value = hexColor;
  colorPickerHexInput.value = hexColor;

  // Set alpha slider value
  if (colorPickerAlpha && colorPickerAlphaValue) {
    const alphaPercent = Math.round(alpha * 100);
    colorPickerAlpha.value = alphaPercent;
    colorPickerAlphaValue.textContent = alphaPercent + '%';
  }

  // Position the popup at the widget's location
  if (widget) {
    const rect = widget.getBoundingClientRect();
    colorPickerPopup.style.left = `${rect.left}px`;
    colorPickerPopup.style.top = `${rect.bottom + 4}px`;
  }

  // Show the popup
  colorPickerPopup.style.display = 'block';
}

/**
 * Close color picker popup
 */
function closeColorPicker() {
  const colorPickerPopup = document.getElementById('colorPickerPopup');
  if (colorPickerPopup) {
    colorPickerPopup.style.display = 'none';
  }
}

/**
 * Initialize color picker event handlers
 * IMPORTANT: Must be called AFTER cssEditorCM is initialized
 */
function initColorPicker() {
  const colorPickerInput = document.getElementById('colorPickerInput');
  if (!colorPickerInput || !cssEditorCM) {
    console.error('❌ Color picker init failed:', { colorPickerInput: !!colorPickerInput, cssEditorCM: !!cssEditorCM });
    return;
  }

  console.log('✅ Initializing color picker...');

  const colorPickerHexInput = document.getElementById('colorPickerHexInput');
  const colorPickerClose = document.getElementById('colorPickerClose');
  const colorPickerPopup = document.getElementById('colorPickerPopup');

  // Close button handler
  if (colorPickerClose) {
    colorPickerClose.addEventListener('click', closeColorPicker);
  }

  // Click outside to close
  if (colorPickerPopup) {
    document.addEventListener('click', function(e) {
      if (colorPickerPopup.style.display === 'block' &&
          !colorPickerPopup.contains(e.target) &&
          !e.target.classList.contains('color-preview-marker')) {
        closeColorPicker();
      }
    });
  }

  // Hex input handler - sync with color input
  if (colorPickerHexInput) {
    colorPickerHexInput.addEventListener('input', function(e) {
      const hexValue = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
        colorPickerInput.value = hexValue;
        colorPickerInput.dispatchEvent(new Event('change'));
      }
    });
  }

  // Color picker change handler - sync with hex input
  colorPickerInput.addEventListener('input', function(e) {
    if (colorPickerHexInput) {
      colorPickerHexInput.value = e.target.value;
    }
  });

  // Alpha slider event handlers
  const colorPickerAlpha = document.getElementById('colorPickerAlpha');
  const colorPickerAlphaValue = document.getElementById('colorPickerAlphaValue');

  if (colorPickerAlpha && colorPickerAlphaValue) {
    // Update alpha value display
    colorPickerAlpha.addEventListener('input', function(e) {
      const alphaPercent = e.target.value;
      colorPickerAlphaValue.textContent = alphaPercent + '%';
    });

    // Apply alpha when slider changes
    colorPickerAlpha.addEventListener('change', function() {
      // Trigger color change to apply alpha
      colorPickerInput.dispatchEvent(new Event('change'));
    });
  }

  // Color picker change handler (applies color to CSS editor)
  colorPickerInput.addEventListener('change', function(e) {
    if (!currentColorMark || !cssEditorCM) return;
    let newColor = e.target.value;
    const { line, startCh, endCh, originalColor } = currentColorMark;

    // Get alpha value from slider
    const colorPickerAlpha = document.getElementById('colorPickerAlpha');
    const alphaValue = colorPickerAlpha ? parseInt(colorPickerAlpha.value) / 100 : 1.0;

    // Apply alpha if less than 100%
    if (alphaValue < 1.0) {
      // Convert hex to rgba with alpha
      const hex = newColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      newColor = `rgba(${r}, ${g}, ${b}, ${alphaValue.toFixed(2)})`;
    } else if (originalColor && (originalColor.startsWith('rgba') || originalColor.startsWith('hsla'))) {
      // If original was rgba/hsla but alpha is 100%, keep as hex
      // (already in hex format)
    }

    try {
      const currentLine = cssEditorCM.getLine(line);
      if (!currentLine) return;

      cssEditorCM.replaceRange(
        newColor,
        { line, ch: startCh },
        { line, ch: endCh }
      );

      const lengthDiff = newColor.length - (endCh - startCh);
      currentColorMark.endCh = endCh + lengthDiff;
    } catch (error) {
      console.warn('Color picker update failed:', error);
    }
  });

  // Add change listener for updating markers
  cssEditorCM.on('change', () => {
    if (markerUpdateTimeout) clearTimeout(markerUpdateTimeout);
    markerUpdateTimeout = setTimeout(() => {
      if (!isUpdatingMarkers) addColorMarkers();
    }, 300);
  });

  // Add initial markers after editor is fully loaded
  setTimeout(() => {
    console.log('⏱️ Running initial color marker scan...');
    if (!isUpdatingMarkers) addColorMarkers();
  }, 500);
}
