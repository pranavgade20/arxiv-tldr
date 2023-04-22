// ==UserScript==
// @name         arxiv tldr
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  show title and abstract of an arxiv link
// @author       Pranav Gade; Michael Keenan
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var links = document.getElementsByTagName('a');

    var dict = {}
    for (var i = 0; i < links.length; i++) {

        if (links[i].href.startsWith("https://arxiv.org/abs/") || links[i].href.startsWith("https://arxiv.org/pdf/")) {
            links[i].addEventListener("mouseenter", function(h){
                if (i in dict) {
                    dict[i].remove();
                    delete dict[i];
                }
                var x = window.event.clientX+3;
                var y = window.event.clientY;
                var innerDiv = document.createElement('div')
                innerDiv.style.cssText = 'position:fixed;width:250px;height:300px;z-index:100;background-color:#fff;padding:8px;opacity:1;top:' + y + 'px;left:' + x + 'px;border: 2px solid;padding 5px;overflow-y:scroll;';

                var outerDiv = document.createElement('div')
                outerDiv.style.cssText = 'position:fixed;width:270px;height:320px;z-index:100;background-color:#f00;opacity:1;top:' + (y-10) + 'px;left:' + (x-10) + 'px;padding 5px;';
                outerDiv.addEventListener("click", function(h2) {
                    location.href = h.target.href;
                })
                outerDiv.addEventListener("mouseleave", function(h2) {
                    outerDiv.remove();
                    delete dict[i];
                })


                outerDiv.appendChild(innerDiv)
                document.body.appendChild(outerDiv)
                dict[i] = outerDiv;

                // URLs be like:
                // https://arxiv.org/abs/2206.14858
                // https://arxiv.org/pdf/1606.06565.pdf
                const absIdMatch = h.target.href.match(/arxiv.org\/abs\/(.*)/);
                const pdfIdMatch = h.target.href.match(/arxiv.org\/pdf\/(.*)\.pdf/)
                const id = absIdMatch?.[1] || pdfIdMatch?.[1];
                if (!id) {
                    console.log(`Couldn't find arxiv id from '${h.target.href}'`);
                    return;
                }

                const arxivApiUrl = `https://export.arxiv.org/api/query?id_list=${id}`;

                Promise.resolve(fetch(arxivApiUrl)).then((val) => {Promise.resolve(val.text()).then((q) => {
                    const html = document.createElement('div')
                    html.innerHTML = q;

                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(q, "text/xml");

                    const title = xmlDoc.getElementsByTagName("title")[1].childNodes[0].nodeValue;
                    const summary = xmlDoc.getElementsByTagName("summary")[0].childNodes[0].nodeValue;
                    const published = xmlDoc.getElementsByTagName("published")[0].childNodes[0].nodeValue;
                    const publishedDatetime = new Date(published);
                    const options = { month: 'long', day: 'numeric', year: 'numeric' };
                    const publishedDate = publishedDatetime.toLocaleDateString('en-US', options);

                    const authors = Array.from(xmlDoc.getElementsByTagName("author"))
                      .map((author) => author.getElementsByTagName("name")[0].textContent)
                      .join(", ");

                    const titleEl = document.createElement('h3');
                    titleEl.innerHTML = `<a href="${h.target.href}">${title}</a>`;
                    innerDiv.appendChild(titleEl);

                    const publishedEl = document.createElement('p');
                    publishedEl.style.fontWeight = 'bold';
                    publishedEl.textContent = publishedDate;
                    innerDiv.appendChild(publishedEl);

                    const authorsEl = document.createElement('p');
                    authorsEl.style.fontStyle = 'italic';
                    authorsEl.textContent = authors;
                    innerDiv.appendChild(authorsEl);

                    const summaryEl = document.createElement('p');
                    summaryEl.textContent = summary;
                    innerDiv.appendChild(summaryEl);
                })})


            })
        }
}
})();
