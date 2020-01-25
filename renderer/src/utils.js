import { PREFIX } from './constants';

export function $(sel) {
  return document.querySelector(sel);
}
export function createEl(
  type = 'div',
  cls = '',
  parent = null,
  content = null
) {
  const el = document.createElement(type);
  el.setAttribute('class', PREFIX + cls);
  if (parent) parent.appendChild(el);
  if (content) el.innerHTML = content;
  return el;
}
export function remove(el) {
  el.parentNode.removeChild(el);
}
export function empty(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
export function formatDate(str) {
  const d = new Date(str);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}
