import h from '../helpers/helpers';
import prismjs from 'prismjs';

const PageLinks = (function() {
  const linkSuffix = 'index.html';
  const animationTime = 300;
  const parser = new DOMParser();
  const content = document.querySelector('.content');
  const title = document.querySelector('title');

  function render(page, url) {
    let doc = parser.parseFromString(page, "text/html");
    let payload = doc.querySelector('.content');
    title.textContent = doc.querySelector('title').textContent;
    setTimeout(() => {
      content.innerHTML = payload.innerHTML;
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      addListeners();
      window.scroll(0, 0);
      prismjs.highlightAll();
      history.pushState(null, title.textContent, url);
    }, animationTime);
  }

  function unload() {
    document.body.classList.remove('is-loaded');
    document.body.classList.add('is-loading');
  }

  function load(url) {
    h.ajaxGet(url + linkSuffix)
      .catch(function(error) { throw new AJAXError(error); })
      .then((r) => render(r, url))
      .catch(function(error) { throw new ApplicationError(error); });
  }

  function handleLinkClick(event) {
    event.preventDefault();
    let link = event.currentTarget.attributes.href.value;
    unload();
    load(link);
  }

  function addListeners() {
    let links = [].slice.call(document.querySelectorAll('a'));
    links.filter(h.internalLink).map(listen);
    window.onpopstate = function(e) {
      load(document.location.href);
    }
  }

  function listen(link) {
    link.addEventListener('click', handleLinkClick);
  }

  return {
    init: function() {
      addListeners();
    }
  };
}());

export default PageLinks;
