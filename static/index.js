import { reactive, html } from '@arrow-js/core';
import { CountryCodeMap, CountryMap } from 'country-code';
import ArrowTags from 'arrow-tags';
import "@lion/calendar/define";

const to_ev = fn => (...a) => ({ target: t }) => fn(t, ...a);
const STATUS = ['unlisted', 'public'];
const BOSTON_TIME = "US/Eastern";

async function digest(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await crypto.subtle.digest("SHA-256", data);
}

const toMockEvent = () => {
  return {
    "event": {
      "status": "unlisted",
      "name": "Homepage Design",
      "intro": "Design the Homepage",
      "time_zone": "Eastern Time (US & Canada)",
      "start_time": "2023-04-10T23:15:00-00:00",
      "end_time": "2023-04-11T00:15:00-00:00",
      "contact": {
        "name": "John Hoffer",
        "contact_phone": "1234567890",
        "show_phone": true,
        "contact_email": "contact@venue.com",
        "email": "contact@venue.com",
        "show_email": true
      },
      "rsvp_form": {
        "phone": "optional",
        "address": "required",
        "allow_guests": true,
        "accept_rsvps": true,
        "gather_volunteers": true
      },
      "show_guests": true,
      "capacity": 80,
      "venue": {
        "name": "Zoom",
        "address": {
          "address1": "123 Foo St",
          "city": "Pasadena",
          "state": "CA"
        }
      }
    }
  }  
}

const toMockPerson = (idx) => {
  const people = [
    ['Aleta Baun', 'F', 'ID', 'NT', 'PSI'],
    ['Michael Chen', 'M', 'US', 'MA', ''],
    ['Ting Liu', 'F', 'CN', 'HL', 'CCP'],
    ['Cecilia Dada', 'F', 'NG', 'LA', 'APC'],
    ['Aitzaz Hasan', 'M', 'PK', 'KP', ''],
    ['Ashok Singh', 'M', 'IN', 'BR', 'JD'],
    ['Mariana Costa', 'F', 'BR', 'SP', 'PSB']
  ];
  const person = people[idx%people.length];
  const [first, last] = person[0].split(' ');
  const email = person[0].toLowerCase().replace(' ', '_');
  return {
    "person": {
      "email": `${email}@example.com`,
      "last_name": last,
      "first_name": first,
      "sex": person[1],
      "signup_type": 0,
      "employer": '',
      "party": person[4],
      "registered_address": {
        "state": person[3],
        "country_code": person[2]
      }
    } 
  }
}

const toMockBasic = (people) => {
  let countries = "No Countries."
  let parties = "No Parties."
  let ids = "No People."
  if (people.length > 0) {
    const readers = people.map(p => new PersonReader(p, true));
    countries = readers.reduce((o, person) => {
      const { country, short_name } = person;
      if (!country) return o;
      const text = `${short_name}: ${country}`;
      return o + `<div>${text}</div>`;
    },"");
    parties = readers.reduce((o, person) => {
      const { party, short_name } = person;
      if (!party) return o;
      const text = `${short_name}: ${party}`;
      return o + `<div>${text}</div>`;
    },"");
    ids = readers.map(person => {
      const { id, short_name } = person;
      const text = `${short_name}: ${id}`;
      return `<div>${text}</div>`;
    }).join('');
  }
  const style = `display: contents;`;
  const hstyle = "grid-column: 1 / -1";
  return [{
    "basic_page": {
      "name": "Page One",
      "content": `<h3 style="${hstyle}">
      People's Countries</h3>
      <div style="${style}">${countries}</div>`,
      "status": "published"
    }
  },{
    "basic_page": {
      "name": "Page Two",
      "content": `<h3 style="${hstyle}">
      People's Parties</h3>
      <div style="${style}">${parties}</div>`,
      "status": "published"
    }
  },{
    "basic_page": {
      "name": "Page Three",
      "content": `<h3 style="${hstyle}">
      People's IDs</h3>
      <div style="${style}">${ids}</div>`,
      "status": "published"
    }
  }]
}

const fromEventDate = (ev, key) => {
  const now = new Date();
  const k = `${key}_time`;
  if (!(k in (ev || {}))) return now;
  return new Date(Date.parse(ev[k]));
}

const setLitDate = (root, ev) => {
  const date = new Date(fromEventDate(ev, 'start'));
  const event_name = 'user-selected-date-changed';
  root.host.__focusedDate = date;
  root.host.selectedDate = date;
  root.host.centralDate = date;
  const detail = { 
    selectedDate: date
  }
  root.host.dispatchEvent(
    new CustomEvent(event_name, { detail })
  );
}

const hasLitDate = (cal_id) => {
  const root = document.getElementById(cal_id).shadowRoot;
  const central = root.host.__centralDate;
  const selected = root.host.__selectedDate;
  if (!central || !selected) return false;
  return selected.getTime() === central.getTime();
}

const getLitDate = (cal_id) => {
  const root = document.getElementById(cal_id).shadowRoot;
  return root.host.__centralDate;
}

// Design tokens
class T {
  static t_on = "color: #182828;";
  static t_white = "color: #EEFFDD;";
  static t_bad = "color: rgb(96, 0, 0);";
  static t_good = "color: rgb(0, 96, 0);";
  static b_main = "background-color: #277125;";
  static b_grey = "background-color: rgba(64,64,64,0.25);";
  static b_9 = "background-color: rgba(255,255,255,0.99);";
  static b_6 = "background-color: rgba(255,255,255,0.66);";
  static b_3 = "background-color: rgba(255,255,255,0.33);";
  static b_light = "background-color: #C7E4C8;";
  static input_field = `
    border: none;
    font-size: 110%;
    font-weight: 500;
    line-height: 175%;
    padding: 0.25rem;
    box-sizing:border-box;
    border-radius: 0.25rem;
    font-family: sans-serif;
  `;
  static typeface = `
    font-family: Optima, Candara, sans-serif;
  `
  static button_deselect = `
    ${T.b_3} ${T.t_bad}
  `;
  static button_select = `
    ${T.b_9} color: black;
    border-radius: 0.25rem;
    box-shadow: 0px 0px 3px 1px rgba(0, 96, 0, 0.25),
               -3px 5px 6px 0px rgba(0, 96, 0, 0.25);
  `;
  static button_simple = `
    ${T.typeface}
    border: none;
    cursor: pointer;
    border-radius: 0.25rem;
    box-shadow: 0px 0px 3px 1px rgba(0, 0, 0, 0.12),
               -3px 5px 6px 0px rgba(0, 0, 0, 0.12);
  `;
  static button_dull = `
    ${T.b_grey} ${T.t_bad}
  `;
  static button_main = `
    ${T.button_simple} ${T.b_main} ${T.t_white} 
  `;
  static status_colors = [T.t_bad, T.t_good];
  static select_colors = [
    `${T.button_simple} ${T.b_3} ${T.t_good}`,
    `${T.button_simple} ${T.b_6} `,
  ];
  static center = `
    display: grid;
    align-content: center;
    justify-content: center;
  `
  static flex_fit = `
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  `
}

const deleteAPI = async (url) => {
  return await fetch(url, {
    method: "DELETE", cache: "no-cache",
    headers: { "Content-Type": "application/json" }
  });
}

const sendData = async (data, url, method) => {
  return await fetch(url, {
    method, cache: "no-cache",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

const toTestForms = (name) => {
  if (name === "event") {
    return [[{
        legend: 'Event Info', 
        name: 'info', 
        error: false,
        message: '',
        fields: [
          { name: "name" },
          { name: "intro" },
          { name: "venue" },
          { name: "person" },
          { name: "status" },
        ]
      }, {
        legend: `Schedule (${BOSTON_TIME})`,
        name: 'schedule',
        error: false,
        message: '',
        fields: [
          { name: "start_time" },
          { name: "end_time" },
          { name: "date", readonly: true, class: "date" },
          { name: "calendar" },
        ]
      }]]
  }
  if (name === "person") {
    return [[{
      legend: 'Person',
      name: 'person',
      error: false,
      message: '',
      fields: [{
        name: "first_name",
      }, {
        name: "last_name",
      }, {
        name: "country",
        list: [...CountryCodeMap.values()]
      }]
    }]];
  }
  if (name === "basic") {
    return [[{
      legend: 'Basic Page',
      name: 'basic',
      error: false,
      message: '',
      fields: [{
        name: "content"
      }]
    },{
      legend: 'Basic Page',
      name: 'basic',
      error: false,
      message: '',
      fields: [{
        name: "content"
      }]
    },{
      legend: 'Basic Page',
      name: 'basic',
      error: false,
      message: '',
      fields: [{
        name: "content"
      }]
    }]]
  }
  if (name === "survey") {
    return [[{
      legend: 'Survey',
      name: 'survey',
      error: false,
      message: '',
      fields: []
    }]]
  }
  return [];
}

const toggleTest = (d, name) => {
  d.focus = "";
  const test = d.tests[name];
  if (!test.hidden) {
    test.hidden = true;
    test.forms = [];
    return d;
  }
  test.hidden = false;
  const is_null = d.sources[name] === null;
  const no_length = d.sources[name]?.length === 0;
  if (!is_null && !no_length) {
    test.forms = toTestForms(name);
  }
  return test;
}

const updateEvent = async (d, data) => {
  const ev_id = d.sources.event.id;
  const url = `/api/pages/events/${ev_id}`;
  const get_url = "/api/pages/events";
  await sendData(data, url, 'PUT');
  const response = await fetch(get_url);
  const { results } = await response.json();
  if (!results?.length) return null;
  return results[0];
}

const createEvent = async (data) => {
  const url = "/api/pages/events";
  await sendData(data, url, 'POST');
  const response = await fetch(url);
  const { results } = await response.json();
  if (!results?.length) return null;
  return results[0];
}

const toBasicMessage = (basic) => {
  return basic.slice(0,3).map(({id}) => id).join('-');
}

const updatePerson = async (d, data) => {
  const who_id = d.sources.person[0].id;
  const url = `/api/people/${who_id}`;
  const get_url = "/api/people";
  await sendData(data, url, 'PUT');
  const response = await fetch(get_url);
  const { results } = await response.json();
  if (!results?.length) return null;
  const basic = await createBasic(toMockBasic(results));
  const update = toUpdater(toBasicMessage(basic));
  d.tests.basic.forms = d.tests.basic.forms.map(update);
  d.sources.basic = basic;
  return results;
}

const deletePerson = async (who_id, d) => {
  await deleteAPI(`/api/people/${who_id}`);
  const response = await fetch('/api/people');
  const { results } = await response.json();
  const basic = await createBasic(toMockBasic(results));
  const update = toUpdater(toBasicMessage(basic));
  d.tests.basic.forms = d.tests.basic.forms.map(update);
  d.sources.basic = basic;
  return results || [];
}

const createPerson = async (d, data) => {
  const url = "/api/people";
  if (data !== null) {
    await sendData(data, url, 'POST');
  }
  const response = await fetch(url);
  const { results } = await response.json();
  const basic = await createBasic(toMockBasic(results));
  const update = toUpdater(toBasicMessage(basic));
  d.tests.basic.forms = d.tests.basic.forms.map(update);
  d.sources.basic = basic;
  return results || [];
}

const createBasic = async (to_basic) => {
  const data = await to_basic;
  const url = "/api/basic_pages";
  if (data !== null) {
    await sendData(data[2], url, 'POST');
    await new Promise(r => setTimeout(r, 10));
    await sendData(data[1], url, 'POST');
    await new Promise(r => setTimeout(r, 10));
    await sendData(data[0], url, 'POST');
  }
  const response = await fetch(url);
  const { results } = await response.json();
  return results || [];
}

const toRoot = (nav,core) => {
  const props = {
    style: `
      ${T.typeface}
      display: grid;
      height: 100%;
      grid-column: 2;
      padding: 0.5rem;
      overflow: scroll;
      grid-template-columns: 1fr minmax(300px, 90vw) 1fr;
      grid-template-rows: 1fr auto;
    `
  };
  const { Div } = ArrowTags;
  return Div`${nav}${core}`(props);
}

const change_tz = (t0, change) => {
  const tz = ['en-US', { timeZone: BOSTON_TIME }];
  const off = new Date(t0.toLocaleString(...tz));
  const _t = t0.getTime.bind(t0);
  const _o = off.getTime.bind(off);
  return new Date(change(_t,_o));
}

const loc_to_bos = (loc) => {
  const change = (l, o) => l() - (l() - o());
  return change_tz(loc, change);
}

const bos_to_loc = (bos) => {
  const change = (b, o) => b() + (b() - o());
  return change_tz(bos, change);
}

const toDateTime = (date, time) => {
  const [ h, m ] = time.split(':');
  const bos = new Date(date);
  bos.setMinutes(parseInt(m));
  bos.setHours(parseInt(h));
  const loc = bos_to_loc(bos);
  const iso = loc.toISOString();
  const utc = '-00:00';
  return iso.replace(/:..\..*/, utc);
}

const formatPerson = (cal_id, sources, entries) => {
  const p = sources.person[0] || toMockPerson().person;
  const o = Object.fromEntries(entries);
  const cc = CountryMap.get(o.country) || "";
  p.registered_address.country_code = cc;
  p.first_name = o.first_name;
  p.last_name = o.last_name;
  return { person: p };
}

const formatEvent = (cal_id, sources, entries) => {
  const e = sources.event || toMockEvent().event;
  const o = Object.fromEntries(entries);
  const new_schedule = true;
  const new_info = true;
  if (new_info) {
    e.name = o.name;
    e.intro = o.intro;
    e.venue.name = o.venue;
    e.contact.name = o.person;
    e.status = STATUS[+('status' in o)];
  }
  if (new_schedule) {
    const d = getLitDate(cal_id);
    e.end_time = toDateTime(d, o.end_time);
    e.start_time = toDateTime(d, o.start_time);
  }
  return { event: e };
}

class EventReader {
  constructor(d) {
    this.d = d;
  }
  get e() {
    return this.d.sources.event;
  }
  get end_time () {
    const loc = fromEventDate(this.e, 'end');
    const bos = loc_to_bos(loc);
    return bos.toTimeString().match(/\d\d:\d\d/)[0];
  }
  get start_time () {
    const loc = fromEventDate(this.e, 'start');
    const bos = loc_to_bos(loc);
    return bos.toTimeString().match(/\d\d:\d\d/)[0];
  }
  get person () {
    return this.e?.contact.name || "";
  }
  get venue () {
    return this.e?.venue.name || "";
  }
  get status () {
    return this.e?.status === STATUS[1];
  }
  get intro() {
    return  this.e?.intro || "";
  }
  get name() {
    return  this.e?.name || "";
  }
}

class PersonReader {
  constructor(d, one) {
    if (one) {
      this.d = {
        sources: {
          person: [d]
        }
      }
    }
    else {
      this.d = d;
    }
  }
  get p() {
    return this.d.sources.person[0] || null;
  }
  get id() {
    return this.p.id || 0;
  }
  get party() {
    return this.p.party || "";
  }
  get country_code() {
    const { registered_address } = this.p || {};
    return registered_address?.country_code || "";
  }
  get country() {
    const { country_code } = this;
    return CountryCodeMap.get(country_code) || "";
  }
  get last_name() {
    return this.p?.last_name;
  }
  get first_name() {
    return this.p?.first_name;
  }
  get short_name() {
    const init = this.last_name[0].toUpperCase();
    return `${this.first_name} ${init}.`
  }
}

class BasicReader {
  constructor(d, index) {
    this.index = index;
    this.d = d;
  }
  get b() {
    const index = this.index;
    return this.d.sources.basic[index] || null;
  }
  get content() {
    return this.b?.content || "";
  }
  get name() {
    return this.b?.name || "";
  }
}

const toCalendar = (field) => {
  const style = `
    grid-column-start: 1;
    grid-column-end: -1;
    margin-top: 0.5rem;
  `
  return `
    <lion-calendar style="${style}"
    name="cal" id="event-calendar"
    >
    </lion-calendar>
  `;
}

const toField = (idx0, form, cal_id, reader) => {
  return (field, idx1) => {
    const key = [idx0, idx1].join('---');
    const { Input, Label, _ } = ArrowTags;
    if (field.name === "calendar") {
      return toCalendar(field);
    }
    const type = {
      "status": "checkbox",
      "end_time": "time",
      "start_time": "time",
      "country": "",
      "date": "date"
    }[field.name] || "text"
    const is_bool = type === "checkbox";
    const value = () => {
      if (!(field.name in reader)) return "";
      return reader[field.name];
    }
    const lab = {
      "name": "Name",
      "intro": "Intro",
      "status": "Published",
      "end_time": "End time",
      "date": "Day of Event",
      "venue": "Location / Venue",
      "start_time": "Start time",
      "person": "Contact Person",
      "first_name": "Given Name",
      "last_name": "Surname",
      "country": "Country"
    }[field.name];
    const for_time = ["", `
      display: grid;
      align-content: stretch;
      justify-content: stretch;
      grid-template-columns: auto 1fr;
    `][+(type === "time")];
    const for_editable = [``, `
      ${T.b_light}
      box-shadow: 0px 0px 3px 1px rgba(0, 64, 0, 0.20) inset,
                 -3px 5px 6px 0px rgba(0, 64, 0, 0.20) inset;
    `][+!(is_bool || field.readonly)];
    const list = field.list || null;
    const list_id = `${key}-list`;
    const checked = value;
    const inp = Input()({
      ...field, type, value, checked,
      ...(list ? { list : list_id } : {}),
      style: `
        ${for_time}
        ${T.typeface}
        ${for_editable}
        ${T.input_field}
        width: 100%;
      `,
    });
    const for_checkbox = [
      "", `
        ${T.center}
        line-height: 300%;
        text-align: center;
        grid-template-columns: 1fr 1fr;
      `
    ][+is_bool];
    const lab_props = { 
      style: `
        ${for_checkbox}
        font-size: 120%;
        display: grid;
      `,
      html, key
    }
    const datalist = list ? toDatalist(list, list_id) : '';
    return Label(lab, datalist, inp)(lab_props);
  }
}

const toDatalist = (opts, id) => {
  const { Option, Datalist } = ArrowTags;
  const options = opts.map((opt, key) => {
    return Option`${opt}`({ key, html });
  })
  return Datalist('', ...options)({ id: () => id });
}

const toFieldset = (cal_id, reader) => {
  return (fieldset, idx0, form) => {
    const { Legend, Fieldset, Input, Div, A } = ArrowTags;
    const leg_props = { 
      style: `
        font-size: 125%;
        height: 1.5rem;
        padding: 0.3rem;
        background-color: inherit;
        border-top: inherit;
        border-left: inherit;
        border-right: inherit;
        border-radius: 0.5rem 0.5rem 0 0;
        transform: translateY(-1rem);
      `
    };
    const leg = Legend`${() => fieldset.legend}`(leg_props);
    const fs = fieldset.fields.map(toField(idx0, form, cal_id, reader));
    const verb = {
      "survey": "Submit"
    }[fieldset.name] || "Update";
    const submit = Input()({
      value: `${verb} ${fieldset.name}`,
      name: fieldset.name,
      type: "submit",
      style: `
        ${T.button_main}
        font-weight: 600;
        font-size: 100%;
      `
    });
    const feedback = A`
      ${() => fieldset.message}
    `({
      href: "javascript:;",
      name: `${fieldset.name}-feedback`,
      "@click": (e) => {
        fieldset.message = "";
        fieldset.error = false;
      },
      style: () => `
        ${T.status_colors[+!fieldset.error]}
      `
    })
    const footer = Div`
      ${feedback} ${submit}
    `({
      style: () => `
        grid-template-rows: auto 1fr;
        grid-template-columns: 1fr;
        font-size: 1.25rem;
        font-weight: 600;
        display: grid;
        gap: 0.25rem;
        height: 4rem;
      `
    });
    const props = {
      style: `
        ${T.center} ${T.flex_fit}
        ${T.b_9} gap: 0.5rem;
        border-radius: 0.5rem;
        padding: 0.5rem;
      `,
      name: fieldset.name,
      html, key: idx0 
    }
    return Fieldset(leg, ...fs, footer)(props);
  }
}

const toErr = (valid, name) => {
  if (valid) return null;
  if (name === "schedule") {
    return "Please choose a day";
  }
}

const validateFieldset = (cal_id, name) => {
  if (name === "schedule") return hasLitDate(cal_id);
  return true;
}

const toButton = (cal_id, d) => ({ fn, props }) => {
  const { Button } = ArrowTags;
  return Button`${fn(d)}`({
    '@click': props['@click'](cal_id, d),
    style: `
        ${T.button_main}
        height: 2em;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.5rem 1rem;
      `
  });
}

const toButtons = (cal_id, ev_fn, d) => {
  return ev_fn(d).buttons.map(toButton(cal_id, d));
}

const toSectionNav = (cal_id, ev_fn, d) => {
  const { Div } = ArrowTags;
  const buttons = toButtons(cal_id, ev_fn, d);
  return Div(...buttons)({
    style: `
      ${T.center} ${T.flex_fit}
      display: grid;
      grid-column: 2;
      gap: 1.25rem;
    `
  });
}

const toForm = (cal_id, label, d) => {
  return (form, key) => {
    const { Form, Div } = ArrowTags;
    const props = {
      html, key,
      style: `
        grid-column: 1 / -1;
        padding-top: 1rem;
        display: grid;
        gap: 1.25rem;
      `,
      "@submit": (e) => {
        const valid = validateFieldset(cal_id, e.submitter.name);
        const found = form.find(f => f.name === e.submitter.name);
        const fieldset = found || form[0];
        // Assign focus to the feedback
        d.focus = `${fieldset.name}-feedback`;
        // Check if active event
        if (d.sources[label] === null) {
          fieldset.message = "Unable to update";
          fieldset.error = true;
          return;
        }
        const err = toErr(valid, e.submitter.name);
        const updater = {
          "event": updateEvent,
          "person": updatePerson
        }[label];
        const formatter = {
          "event": formatEvent,
          "person": formatPerson
        }[label];
        const entries = [...new FormData(e.target).entries()];
        const data = formatter(cal_id, d.sources, entries);
        fieldset.message = "...";
        fieldset.error = false;
        updater(d, data).then((ev) => {
          d.sources[label] = ev;
          setTimeout(() => {
            fieldset.message = [err, `Updated ${label}`][+valid];
            fieldset.error = valid === false;
          }, 50);
        }).catch(() => {
          fieldset.message = "Unable to update";
          fieldset.error = true;
        });
        e.preventDefault();
      }
    }
    const reader = {
      "event": new EventReader(d),
      "person": new PersonReader(d),
      "basic": (index) => new BasicReader(d, index),
      "survey": new PersonReader(d)
    }[label];
    if (label === "basic") {
      const content0 = reader(0).content;
      const content1 = reader(1).content;
      const content2 = reader(2).content;
      return Div`
        ${content0} ${content1} ${content2}
      `({
        html, key, style: `
          ${T.center} ${T.flex_fit}
          grid-column: 1 / -1;
          padding: 1rem;
          display: grid;
          gap: 0.25rem;
        `
      });
    }
    const fs = form.map(toFieldset(cal_id, reader));
    return Form(...fs)(props);
  }
}

const toSection = (pre, cal_id, d) => {
  return ([h2, label], idx) => {
    const ev_fn = () => d.tests[label];
    const styles = T.select_colors;
    const { Div, H2 } = ArrowTags;
    const show = () => !ev_fn(d).hidden;
    const to_style = () => {
      return `
        display: grid;
        gap: 0.5rem 0;
        padding: 0.25rem;
        pointer-events: all;
        grid-template-columns: auto 1fr;
      `+styles[+show()];
    }
    const key = `${pre} ${idx}`;
    const props = {
      html, key, style: to_style
    }
    const h2_props = {
      style: `margin: 0; padding-left: 0.5rem; cursor: pointer;`,
      '@click': (e) => {
        toggleTest(d, ev_fn(d).name);
      }
    };
    const toggle = Div((d) => {
      return ['▸', '▾'][+show()];
    })({
      style: () => `
        font-weight: 400;
        font-size: 2.5rem;
        cursor: pointer;
        height: 1.5rem;
        line-height: 0.6em;
        padding: 0.3rem 0.5rem 0.5rem 0.5rem;
      ` + [T.button_main, T.button_deselect][+show()],
      '@click': (e) => {
        toggleTest(d, ev_fn(d).name);
      }
    });
    const forms = ev_fn(d).forms.map(toForm(cal_id, label, d));
    if (ev_fn(d).hidden) {
      return Div(toggle, H2(h2)(h2_props))(props);
    }
    const nav = toSectionNav(cal_id, ev_fn, d);
    return Div(
      toggle, H2(h2)(h2_props), nav, ...forms
    )(props);
  }
}

const toSectionsPrefix = (d) => {
  return [...Object.values(d.tests)].map(v => {
    return JSON.stringify(
      [+v.hidden].concat(v.forms.map(f => {
        return f.map(fs => fs.message);
      }))
    );
  }).join(' ');
}

const toSections = (cal_id) => {
  return (d) => {
    const pre = toSectionsPrefix(d);
    const prefix = 'API Endpoint: ';
    const labels = [...Object.entries({
      "Events": "event",
      "People": "person",
      "Sites + People": "basic",
      "Surveys + Contact": "survey" 
    })];
    return labels.map(([k,v]) => {
      return [prefix+k, v];
    }).map(toSection(pre, cal_id, d));
  }
}

const toPageCore = (fn) => {
  const { Div } = ArrowTags;
  const props = {
    style: `
      grid-row: 3;
      grid-column: 2;
      display: grid;
      padding-top: 1rem;
      gap: 0.5rem;
    `
  }
  return Div`${fn}`(props);
}

const toUpdater = (message) => {
  return form => {
    return form.map((fieldset) => {
      return { ...fieldset, message, error: false };
    });
  }
}

const toDefaultPerson = (name) => {
  const info = "Latest Person";
  const buttons = [{
    props: {
      '@click': to_ev((_, cal_id, d) => {
          d.focus = "";
          const test = d.tests.person;
          test.forms = toTestForms('person');
          createPerson(d, null).then((people) => {
            return createPerson(d, toMockPerson(people.length));
          }).then((people) => {
            const new_id = people[0]?.id || 0;
            const update = toUpdater(`Created Person #${new_id}`);
            d.tests.person.forms = d.tests.person.forms.map(update);
            d.sources.person = people;
          });
      })
    },
    fn: d => () => {
      return 'New Person';
    }
  },{
    props: {
      '@click': to_ev((_, cal_id, d) => {
          d.focus = "";
          const test = d.tests.person;
          const source = d.sources.person;
          const old_id = source[0]?.id || 0;
          test.forms = toTestForms('person');
          if (test.length === 0) {
            throw new Error('No Person to Delete');
          }
          deletePerson(old_id, d).then((people) => {
            const update = toUpdater(`Deleted Person #${old_id}`);
            d.tests.person.forms = d.tests.person.forms.map(update);
            d.sources.person = people;
          });
      })
    },
    fn: d => () => {
      return 'Delete Person';
    }
  }];
  return {
    name, info, buttons, forms: [], hidden: true
  };
}

const toDefaultBasic = (name) => {
  const info = "Basic Pages";
  const buttons = [{
    props: {
      '@click': to_ev((_, cal_id, d) => {
          d.focus = "";
          const test = d.tests.basic;
          test.forms = toTestForms('basic');
          createPerson(d, null);
      })
    },
    fn: d => () => {
      return 'Create 3 Pages';
    }
  }];
  return {
    name, info, buttons, forms: [], hidden: true
  };
}

const toDefaultSurvey = (name) => {
  const info = "Survey";
  const buttons = [{
    props: {
      '@click': to_ev((_, cal_id, d) => {
          d.focus = "";
          const test = d.tests.survey;
          test.forms = toTestForms('survey');
      })
    },
    fn: d => () => {
      return 'Create Survey';
    }
  }];
  return {
    name, info, buttons, forms: [], hidden: true
  };
}

const toDefaultEvent = (name) => {
  const info = "Latest Event";
  const buttons = [{
    props: {
      '@click': to_ev((_, cal_id, d) => {
          d.focus = "";
          const test = d.tests.event;
          test.forms = toTestForms('event');
          createEvent(toMockEvent()).then((ev) => {
            const update = toUpdater(`Created Event #${ev.id}`);
            d.tests.event.forms = d.tests.event.forms.map(update);
            d.sources.event = ev;
          });
      })
    },
    fn: d => () => 'New Event'
  }];
  return {
    name, info, buttons, forms: [], hidden: true
  };
}
const toDefault = () => {
  return {
    n: -1,
    msg: 'Welcome',
    sources: {
      event: null,
      basic: [],
      person: []
    },
    focus: '',
    tests: {
      event: toDefaultEvent('event'),
      person: toDefaultPerson('person'),
      basic: toDefaultBasic('basic'),
      survey: toDefaultSurvey('survey')
    }
  }
}

const updateDateInput = (e) => {
  // get parent of e target
  const { selectedDate } = e.detail;
  const fieldset = e.target.parentElement;
  const input = fieldset.getElementsByClassName("date")[0];
  input.valueAsDate = selectedDate;
}

const observe = (d, id1, id2) => {
  // Handle shadow dom of id2
  const el = document.getElementById(id1);
  new MutationObserver(() => {
    const root = document.getElementById(id2)?.shadowRoot;
    if (!root) return;
    new MutationObserver(() => {
      setLitDate(root, d.sources.event);
    }).observe(root, { subtree: false, childList: true });
    // Handle events
    const event_name = 'user-selected-date-changed';
    root.host.addEventListener(event_name, updateDateInput);
    // Style the calendar
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerText = `
      .calendar__navigation > div > button {
        color: inherit; 
        font-size: 30px;
        background-color: transparent;
      }
      .calendar__navigation > div {
        ${T.button_main} ${T.center}
        grid-template-columns: 1fr auto 1fr;
      }
      table.calendar__grid button[previous-month],
      table.calendar__grid button[next-month] {
        ${T.button_dull}
      }
      table.calendar__grid button {
        ${T.button_main}
        font-size: 120%;
        width: 100%;
      }
      table.calendar__grid button[selected] {
        ${T.button_select}
      }
      .calendar__navigation {
        ${T.center} ${T.flex_fit}
        grid-gap: 0.5rem;
      }
    `;
    root.appendChild(style);
    // Refocus form element
    const el = document.getElementsByName(d.focus)[0];
    if (el === undefined) return;
    setTimeout(() => {
      el.setAttribute('tabindex', '0');
      el.focus();
    }, 0);
  }).observe(el, { subtree: true, childList: true });
}

const main = () => {
  const id = 'api-root';
  const cal_id = "event-calendar";
  const data = reactive(toDefault());
  observe(data, id, cal_id);
  const { render } = ArrowTags;
  const core = toPageCore(toSections(cal_id));
  const root = toRoot(core);
  render(id, html, data, root);
}

export default main
