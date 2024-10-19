// Variables globales para almacenar el texto y los resultados de búsqueda
let text1 = "",
  text2 = "";
let tokens = [],
  trie = null;
let searchResults = [],
  currentMatchIndex = -1;

// Event listeners para los botones y campos de entrada
document.getElementById("loadFilesButton").addEventListener("click", loadFiles);
document
  .getElementById("searchButton")
  .addEventListener("click", searchPattern);
document.getElementById("nextMatchButton").addEventListener("click", nextMatch);
document.getElementById("prevMatchButton").addEventListener("click", prevMatch);
document
  .getElementById("similarityButton")
  .addEventListener("click", findSimilarity);
document
  .getElementById("palindromeButton")
  .addEventListener("click", findPalindrome);
document
  .getElementById("autocompleteInput")
  .addEventListener("input", autocomplete);
document.getElementById("searchPattern").addEventListener("input", function () {
  clearSearch();
});

// Deshabilitar botones de navegación inicialmente
document.getElementById("nextMatchButton").disabled = true;
document.getElementById("prevMatchButton").disabled = true;

// Función para cargar archivos y procesar su contenido
function loadFiles() {
  const fileInput1 = document.getElementById("fileInput1").files[0];
  const fileInput2 = document.getElementById("fileInput2").files[0];

  if (fileInput1) {
    const reader1 = new FileReader();
    reader1.onload = function (e) {
      text1 = e.target.result;
      document.getElementById("text1").innerText = text1;
      tokens = tokenize(text1);
      trie = buildTrie(tokens);
    };
    reader1.readAsText(fileInput1);
  }

  if (fileInput2) {
    const reader2 = new FileReader();
    reader2.onload = function (e) {
      text2 = e.target.result;
      document.getElementById("text2").innerText = text2;
      document.getElementById("similarityButton").disabled = false;
    };
    reader2.readAsText(fileInput2);
  } else {
    document.getElementById("similarityButton").disabled = true;
  }
  clearSearch();
}

// Función para tokenizar el texto
function tokenize(text) {
  return text.toLowerCase().match(/\p{L}+/gu) || [];
}

// Definición de la estructura del nodo del Trie
function TrieNode() {
  this.children = {};
  this.isEndOfWord = false;
}

// Construcción del Trie a partir de las palabras tokenizadas
function buildTrie(words) {
  let root = new TrieNode();
  words.forEach((word) => {
    let node = root;
    for (let char of word) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.word = word;
  });
  return root;
}

// Función de autocompletado basada en el Trie
function autocomplete() {
  const input = document
    .getElementById("autocompleteInput")
    .value.toLowerCase();
  const suggestionsDiv = document.getElementById("autocompleteSuggestions");
  suggestionsDiv.innerHTML = "";
  if (input === "") return;

  let suggestions = getWordsFromTrie(trie, input);
  suggestions.forEach((word) => {
    let item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = word;
    item.addEventListener("click", () => {
      document.getElementById("autocompleteInput").value = word;
      suggestionsDiv.innerHTML = "";
    });
    suggestionsDiv.appendChild(item);
  });
}

// Obtener palabras del Trie que comienzan con un prefijo dado
function getWordsFromTrie(root, prefix) {
  let node = root;
  for (let char of prefix) {
    if (!node.children[char]) return [];
    node = node.children[char];
  }

  let words = [];
  function dfs(node) {
    if (node.isEndOfWord) words.push(node.word);
    for (let child in node.children) dfs(node.children[child]);
  }
  dfs(node);
  return words;
}

// Función principal de búsqueda de patrones
function searchPattern() {
  const pattern = document.getElementById("searchPattern").value.toLowerCase();
  if (pattern.length === 0) {
    clearSearch();
    return;
  }
  searchResults = KMP(text1.toLowerCase(), pattern);
  currentMatchIndex = -1;

  if (searchResults.length === 0) {
    alert("No se encontraron coincidencias.");
    clearSearch();
  } else {
    document.getElementById("nextMatchButton").disabled = false;
    document.getElementById("prevMatchButton").disabled = false;
    highlightAllMatches();
    nextMatch();
  }
}

// Implementación del algoritmo Knuth-Morris-Pratt (KMP) para búsqueda de patrones
function KMP(text, pattern) {
  let lps = Array(pattern.length).fill(0);
  let j = 0,
    i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[j]) lps[i++] = ++j;
    else if (j > 0) j = lps[j - 1];
    else lps[i++] = 0;
  }
  let results = [],
    m = 0,
    n = 0;
  while (m < text.length) {
    if (pattern[n] === text[m]) {
      m++;
      n++;
    }
    if (n === pattern.length) {
      results.push(m - n);
      n = lps[n - 1];
    } else if (m < text.length && pattern[n] !== text[m]) {
      n > 0 ? (n = lps[n - 1]) : m++;
    }
  }
  return results;
}

// Resaltar todas las coincidencias encontradas
function highlightAllMatches() {
  let highlightedText = "";
  let lastIndex = 0;
  const pattern = document.getElementById("searchPattern").value;

  searchResults.forEach((start) => {
    let before = escapeHtml(text1.substring(lastIndex, start));
    let match = `<span class="highlight-yellow">${escapeHtml(
      text1.substring(start, start + pattern.length),
    )}</span>`;
    highlightedText += before + match;
    lastIndex = start + pattern.length;
  });

  highlightedText += escapeHtml(text1.substring(lastIndex));
  document.getElementById("text1").innerHTML = highlightedText;
}

// Navegar a la siguiente coincidencia
function nextMatch() {
  if (searchResults.length === 0) return;
  currentMatchIndex = (currentMatchIndex + 1) % searchResults.length;
  highlightCurrentMatch();
}

// Navegar a la coincidencia anterior
function prevMatch() {
  if (searchResults.length === 0) return;
  currentMatchIndex =
    (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
  highlightCurrentMatch();
}

// Resaltar la coincidencia actual
function highlightCurrentMatch() {
  const allMatches = document.querySelectorAll(".highlight-yellow");
  allMatches.forEach((match) => {
    match.classList.remove("highlight-orange");
  });

  const currentMatch = allMatches[currentMatchIndex];
  if (currentMatch) {
    currentMatch.classList.add("highlight-orange");
    currentMatch.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Escapar caracteres HTML para prevenir inyección XSS
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Limpiar resultados de búsqueda
function clearSearch() {
  searchResults = [];
  currentMatchIndex = -1;
  document.getElementById("nextMatchButton").disabled = true;
  document.getElementById("prevMatchButton").disabled = true;
  clearHighlights();
}

// Eliminar todos los resaltados
function clearHighlights() {
  document.getElementById("text1").innerHTML = escapeHtml(text1);
  document.getElementById("text2").innerHTML = escapeHtml(text2);
}

// Encontrar similitud entre dos textos usando LCS (Longest Common Subsequence)
function findSimilarity() {
  if (text1 === "" || text2 === "") {
    alert("Por favor, cargue ambos textos.");
    return;
  }

  let result = LCS(text1.toLowerCase(), text2.toLowerCase());

  let matchedSubstringText1 = text1.substring(result[0], result[0] + result[2]);
  let matchedSubstringText2 = text2.substring(result[1], result[1] + result[2]);

  let trimmedMatchText1 = matchedSubstringText1.trim();
  let trimmedMatchText2 = matchedSubstringText2.trim();

  let leadingSpacesText1 =
    matchedSubstringText1.length - matchedSubstringText1.trimStart().length;
  let trailingSpacesText1 =
    matchedSubstringText1.length - matchedSubstringText1.trimEnd().length;

  let leadingSpacesText2 =
    matchedSubstringText2.length - matchedSubstringText2.trimStart().length;
  let trailingSpacesText2 =
    matchedSubstringText2.length - matchedSubstringText2.trimEnd().length;

  let startIndexText1 = result[0] + leadingSpacesText1;
  let lengthText1 =
    matchedSubstringText1.length - leadingSpacesText1 - trailingSpacesText1;

  let startIndexText2 = result[1] + leadingSpacesText2;
  let lengthText2 =
    matchedSubstringText2.length - leadingSpacesText2 - trailingSpacesText2;

  if (lengthText1 > 0 && lengthText2 > 0) {
    highlightSubstring(
      text1,
      startIndexText1,
      lengthText1,
      "text1",
      "highlight-blue",
    );
    highlightSubstring(
      text2,
      startIndexText2,
      lengthText2,
      "text2",
      "highlight-blue",
    );
  } else {
    alert("No se encontró una subsecuencia común significativa.");
    clearHighlights();
  }
}

// Implementación del algoritmo LCS (Longest Common Subsequence)
function LCS(text1, text2) {
  let dp = Array(text1.length + 1)
    .fill(null)
    .map(() => Array(text2.length + 1).fill(0));
  let maxLen = 0,
    end1 = 0,
    end2 = 0;

  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLen) {
          maxLen = dp[i][j];
          end1 = i;
          end2 = j;
        }
      }
    }
  }
  return [end1 - maxLen, end2 - maxLen, maxLen];
}

// Resaltar una subcadena específica en el texto
function highlightSubstring(text, start, length, elementId, className) {
  let display = document.getElementById(elementId);
  let before = text.substring(0, start);
  let match = text.substring(start, start + length);
  let after = text.substring(start + length);

  display.innerHTML = `${escapeHtml(before)}<span class="${className}">${escapeHtml(match)}</span>${escapeHtml(after)}`;
}

// Encontrar el palíndromo más largo en el texto
function findPalindrome() {
  let cleanText = text1.replace(/\s+/g, "").toLowerCase();
  let indexMapping = createIndexMapping(text1);
  let result = manacher(cleanText);
  let startIndex = indexMapping[result[0]];
  let endIndex = indexMapping[result[0] + result[1] - 1] + 1;
  highlightSubstring(
    text1,
    startIndex,
    endIndex - startIndex,
    "text1",
    "highlight-green",
  );
}

// Crear un mapeo de índices para manejar espacios en blanco
function createIndexMapping(text) {
  let mapping = [];
  let j = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== " ") {
      mapping[j] = i;
      j++;
    }
  }
  return mapping;
}

// Implementación del algoritmo de Manacher para encontrar palíndromos
function manacher(s) {
  let t = "^#" + s.split("").join("#") + "#$";
  let p = Array(t.length).fill(0);
  let center = 0,
    right = 0,
    maxLen = 0,
    centerIndex = 0;

  for (let i = 1; i < t.length - 1; i++) {
    let mirror = 2 * center - i;
    if (right > i) p[i] = Math.min(right - i, p[mirror]);
    while (t[i + (1 + p[i])] === t[i - (1 + p[i])]) p[i]++;
    if (i + p[i] > right) {
      center = i;
      right = i + p[i];
    }
    if (p[i] > maxLen) {
      maxLen = p[i];
      centerIndex = i;
    }
  }

  let start = (centerIndex - maxLen) / 2;
  return [Math.floor(start), maxLen];
}
