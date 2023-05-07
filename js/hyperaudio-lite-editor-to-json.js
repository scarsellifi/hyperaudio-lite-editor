// Convert Hypertranscript to JSON
function htmlToJson(html) {
  const article = html.querySelector('article');

  // Create an empty object to store the JSON data
  const jsonData = {};

  // Add the <article> element data to the JSON object
  jsonData.article = {};

  // Get the <section> element
  const section = article.querySelector('section');

  // Add the <section> element data to the JSON object
  jsonData.article.section = {};

  // Get the <p> element
  const paragraphs = section.querySelectorAll('p');

  // Add the <p> element data to the JSON object
  jsonData.article.section.paragraphs = [];

  // Iterate through each <p> element
  for (const paragraph of paragraphs) {
    // Create an object to store the <p> element data
    const paragraphData = {};
    // Get all the <span> elements within the <p> element
    const spans = paragraph.querySelectorAll('span');

    // Add the <span> elements data to the JSON object
    paragraphData.spans = [];

    // Iterate through each <span> element
    for (const span of spans) {
      // Create an object to store the <span> element data
      const spanData = {};

      // Get the "data-m" attribute value
      spanData.m = span.getAttribute('data-m');

      // Get the "data-d" attribute value
      spanData.d = span.getAttribute('data-d');

      // Get the class attribute value
      spanData.class = span.getAttribute('class');

      // Get the text content of the <span> element
      spanData.text = span.textContent;

      // Add the <span> element data to the JSON object
      paragraphData.spans.push(spanData);
    }
    jsonData.article.section.paragraphs.push(paragraphData);
  }
  // Return the JSON object
  return jsonData;
}
