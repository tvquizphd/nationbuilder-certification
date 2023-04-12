import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';
import "@lion/calendar/define";

const ev = (fn, d) => ({ target: t }) => fn(d, t);
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
  static b_none = "background-color: inherit;";
  static b_main = "background-color: #277125;";
  static b_white = "background-color: #fefefe;";
  static b_light = "background-color: #e7fbe9;";
  static input_field = `
    border: none;
    font-size: 150%;
    line-height: 175%;
    padding: 0.25rem;
    box-sizing:border-box;
    border-radius: 0.25rem;
  `;
  static typeface = `
    font-family: Optima, Candara, sans-serif;
  `
  static button_deselect = `
    ${T.b_white} ${T.t_bad}
    border-radius: 0.25rem;
    box-shadow: 0px 0px 3px 1px rgba(0, 96, 0, 0.25),
               -3px 5px 6px 0px rgba(0, 96, 0, 0.25);
  `;
  static button_select = `
    ${T.b_light} color: black;
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
    cursor: auto; ${T.b_none} ${T.t_bad}
  `;
  static button_main = `
    ${T.button_simple} ${T.b_main} ${T.t_white} 
  `;
  static status_colors = [T.t_bad, T.t_good];
  static select_colors = [
    `${T.button_simple} ${T.b_white}, ${T.t_good}`, ''
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

const postEvent = async (data, url) => {
  return await fetch(url, {
    method: "POST", cache: "no-cache",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), 
  })
}

const toEventForms = (name) => {
  if (name === "event") {
    return [[{
        legend: 'Event Info', 
        message: '',
        error: false,
        name: 'info', 
        fields: [
          { name: "name" },
          { name: "intro" },
          { name: "venue" },
          { name: "person" },
          { name: "status" },
        ]
      }, {
        legend: `Schedule (${BOSTON_TIME})`,
        message: '',
        error: false,
        name: 'schedule',
        fields: [
          { name: "start_time" },
          { name: "end_time" },
          { name: "date", readonly: true, class: "date" },
          { name: "calendar" },
        ]
      }]]
  }
  return [];
}

const toggleEvent = (d, name, state) => {
  const test = d.tests[name];
  if (!test.hidden && state !== 'on') {
    test.hidden = true;
    test.forms = [];
    return d;
  }
  test.hidden = false;
  test.forms = toEventForms(name);
  return d;
}

const createEvent = async (cal_id, data) => {
  const url = "/api/pages/events";
  await postEvent(data, url);
  const response = await fetch(url);
  const { results } = await response.json();
  if (!results?.length) return null;
  return results[0];
}

const setMessage = (d) => {
  const msgs = [
    'Welcome', '欢迎大家', 'Bienvenidos', 'Вітаємо', 'স্বাগতম৷'
  ];
  const len = msgs.length;
  const random = Math.floor(Math.random() * len);
  const next = msgs.indexOf(d.msg) === random;
  d.msg = msgs[(random + next) % len];
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

const toPageNav = (fn) => {
  const props = {
    style: `
      ${T.flex_fit}
      gap: 1rem;
      grid-row: 1;
      display: grid;
      grid-column: 2;
      padding-top: 1rem;
      padding-bottom: 1rem;
      grid-auto-rows: auto;
      align-content: center;
      justify-content: center;
    `
  };
  const { Div } = ArrowTags;
  return Div`${fn}`(props);
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

const updateEvent = (cal_id, sources, entries) => {
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
    return [false, true][
      this.e?.status === STATUS[1]
    ];
  }
  get intro() {
    return  this.e?.intro || "";
  }
  get name() {
    return  this.e?.name || "";
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

const toField = (idx0, form, cal_id, d) => {
  return (field, idx1) => {
    const key = [idx0, idx1].join('---');
    const er = new EventReader(d);
    const { Input, Label } = ArrowTags;
    if (field.name === "calendar") {
      return toCalendar(field);
    }
    const type = {
      "status": "checkbox",
      "end_time": "time",
      "start_time": "time",
      "date": "date"
    }[field.name] || "text"
    const is_bool = type === "checkbox";
    const value = () => {
      if (!(field.name in er)) return "";
      return er[field.name];
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
    }[field.name];
    const for_time = ["", `
      display: grid;
      align-content: stretch;
      justify-content: stretch;
      grid-template-columns: auto 1fr;
    `][+(type === "time")];
    const for_editable = [``, `
      box-shadow: 0px 0px 3px 1px rgba(0, 64, 0, 0.20) inset,
                 -3px 5px 6px 0px rgba(0, 64, 0, 0.20) inset;
    `][+!(is_bool || field.readonly)];
    const checked = value;
    const inp = Input()({
      ...field, type, value, checked,
      "@click": (e) => {
        const el = e.target.closest('fieldset');
        if (el === null) return;
        const found = form.find(f => f.name === el.name);
        const fieldset = found || form[0];
        fieldset.message = "";
        fieldset.error = false;
      },
      style: `
        ${for_time}
        ${T.b_light}
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
        font-weight: 600;
        display: grid;
      `,
      html, key
    }
    return Label(lab, inp)(lab_props);
  }
}

const toFieldset = (cal_id, d) => {
  return (fieldset, idx0, form) => {
    const { Legend, Fieldset, Input, Div } = ArrowTags;
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
    const fs = fieldset.fields.map(toField(idx0, form, cal_id, d));
    const submit = Input()({
      value: `Update ${fieldset.name}`,
      name: fieldset.name,
      type: "submit",
      style: `
        ${T.button_main}
        font-weight: 600;
        font-size: 100%;
      `
    });
    const footer = Div`
    ${submit} ${() => fieldset.message}
    `({
      style: () => `
        ${T.status_colors[+!fieldset.error]}
        grid-template-rows: 2.25rem 1fr;
        grid-template-columns: 1fr;
        font-size: 1.25rem;
        font-weight: 600;
        display: grid;
        height: 4rem;
        gap: 0.25rem;
      `
    });
    const props = {
      style: `
        ${T.center} ${T.flex_fit}
        ${T.b_white} gap: 0.5rem;
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

const toMainButton = (cal_id, ev_fn, d) => {
  const props = {
    style:  `
      ${T.button_main}
      height: 2em;
      grid-column: 2;
      max-width: 15rem;
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0.5rem 1rem;
    `,
    '@click': ev((d) => {
        toggleEvent(d, 'event', 'on');
        createEvent(cal_id, toMockEvent(), d).then((ev) => {
          ev_fn(d).forms = ev_fn(d).forms.map(form => {
            return form.map((fieldset) => {
              return { 
                ...fieldset,
                message: "Reset",
                error: true
              };
            });
          });
          d.sources.event = ev;
        });
    }, d) 
  };
  const { Button } = ArrowTags;
  const fn = () => {
    if (d.sources.event !== null) {
      return 'Reset Event';
    }
    return 'New Event';
  };
  return Button`${fn}`(props);
}

const toForm = (cal_id, d) => {
  return (form, key) => {
    const { Form } = ArrowTags;
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
        const err = toErr(valid, e.submitter.name);
        fieldset.message = [err, "Updated"][+valid];
        fieldset.error = valid === false;
        const entries = [...new FormData(e.target).entries()];
        const data = updateEvent(cal_id, d.sources, entries);
        createEvent(cal_id, data).then((ev) => {
          d.sources.event = ev;
        });
        e.preventDefault();
      }
    }
    const fs = form.map(toFieldset(cal_id, d));
    return Form(...fs)(props);
  }
}

const toSection = (pre, cal_id, d) => {
  return ([h2, ev_fn], idx) => {
    const styles = T.select_colors;
    const { Div, H2 } = ArrowTags;
    const show = () => !ev_fn(d).hidden;
    const to_style = () => {
      return `
        display: grid;
        gap: 0.5rem 0;
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
        toggleEvent(d, ev_fn(d).name);
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
        toggleEvent(d, 'event');
      }
    });
    const forms = ev_fn(d).forms.map(toForm(cal_id, d));
    if (forms.length === 0) {
      return Div(toggle, H2(h2)(h2_props))(props);
    }
    const main_button = toMainButton(cal_id, ev_fn, d);
    return Div(
      toggle, H2(h2)(h2_props), main_button, ...forms
    )(props);
  }
}

const toSectionsPrefix = (d) => {
  return [...Object.values(d.tests)].map(test => {
    return [+v.hidden].concat(v.forms.map(f => {
      return f.map(fs => fs.message).join('-');
    })).join('--');
  }).join('-');
}

const toSections = (cal_id) => {
  return (d) => {
    const pre = toSectionsPrefix(d);
    const prefix = 'API Endpoint: ';
    const labels = [...Object.entries({
      "Events": () => {
        return d.tests.event;
      },
      "People": () => {
        return d.tests.person;
      },
      "Sites + People": () => {
        return d.tests.basic;
      },
      "Surveys + Contact": () => {
        return d.tests.survey;
      }
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
      gap: 0.5rem;
    `
  }
  return Div`${fn}`(props);
}

const toNavItems = (pre, cal_id, d) => {
  const out = [[
      () => `${d.msg}, ${d.n} pages!`,
      { '@click': ev(setMessage, d) }
    ]
  ];
  return out.map(toNavItem(pre));
}

const toNavItem = (prefix) => {
  return ([fn, opts], idx) => {
    const key = `${prefix}-${idx}`;
    const style = `
      ${T.button_main}
      height: 2em;
      font-size: 1.25rem;
      padding: 0.5rem 1rem;
    `;
    const props = { ...opts, html, style, key };
    const { Button } = ArrowTags;
    return Button`${fn}`(props);
  }
}

const toDefaultEvent = (name) => {
  const info = "Latest Event";
  return {
    name, info, forms: [], hidden: true
  };
}
const toDefault = () => {
  return {
    n: -1,
    msg: 'Welcome',
    who: 'John',
    sources: {
      event: null,
    },
    tests: {
      event: toDefaultEvent('event'),
      person: toDefaultEvent('person'),
      basic: toDefaultEvent('basic'),
      survey: toDefaultEvent('survey')
    }
  }
}

const toPages = async (d) =>  {
  const response = await fetch("/api/pages/basic_pages");
  const { results } = await response.json();
  d.n = results.length;
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
        ${T.center}
        ${T.flex_fit}
        grid-gap: 0.5rem;
      }
    `;
    root.appendChild(style);
  }).observe(el, { subtree: true, childList: true });
}

const main = () => {
  const id = 'api-root';
  const cal_id = "event-calendar";
  const data = reactive(toDefault());
  observe(data, id, cal_id);
  const { render } = ArrowTags;
  const toLabel = d => {
   return toNavItems('test', cal_id, d);
  }
  const nav = toPageNav(toLabel);
  const core = toPageCore(toSections(cal_id));
  const root = toRoot(nav, core);
  render(id, html, data, root);
  toPages(data);

}

export default main
