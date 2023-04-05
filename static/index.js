import { reactive, html } from '@arrow-js/core'
import ArrowTags from 'arrow-tags';
import "@lion/calendar/define";

const ev = (fn, d) => ({ target: t }) => fn(d, t);

const toMockEvent = () => {
  return {
    "event": {
      "status": "unlisted",
      "name": "Fasting Day",
      "intro": "Take the 24hr nofoodchallenge!!!",
      "time_zone": "Pacific Time (US & Canada)",
      "start_time": "2013-05-08T17:00:00-00:00",
      "end_time": "2013-05-08T19:00:00-00:00",
      "contact": {
        "name": "Byron Anderson",
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
        "name": "Ralphs Parking Lot",
        "address": {
          "address1": "123 Foo St",
          "city": "Pasadena",
          "state": "CA"
        }
      }
    }
  }  
}


const setLitDate = (cal_id, date) => {
  const root = document.getElementById(cal_id).shadowRoot;
  const event_name = 'user-selected-date-changed';
  root.host.__focusedDate = date;
  root.host.selectedDate = date;
  root.host.centralDate = date;
  root.host.dispatchEvent(
    new CustomEvent(event_name, { detail: { date } })
  );
}

const getLitDate = (cal_id) => {
  const root = document.getElementById(cal_id).shadowRoot;
  return root.host.__centralDate;
}

// Design tokens
class T {
  static t_on = "color: #182828;";
  static t_off = "color: #8C9082;";
  static t_light = "color: #E7FBE9;";
  static b_light = "background-color: #E7FBE9;";
  static b_main = "background-color: #336036;";
  static b_corn = "background-color: Cornsilk;";
  static select = `
    color: white;
    border: 2px solid #3FAF12;
    background-color: #1F8C62;
  `;
  static button_off = `
    border-radius: 0.5rem;
    box-shadow: none;
  `;
  static button_on = `
    ${T.b_main} ${T.t_light} 
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 0px 4px 2px rgba(0, 0, 0, 0.40), 
               -4px 6px 8px 0px rgba(0, 0, 0, 0.40);
  `;
  static button_submit = `
    ${T.button_on}
    font-weight: 600;
    font-size: 120%;
    height: 4rem;
  `
  static center = `
    display: grid;
    align-content: center;
    justify-content: center;
  `

  static flex_fit = `
    grid-template-columns: repeat(auto-fit, minmax(15em, 30vw));
  `
}

const postEvent = async (d) => {
  const data = toMockEvent();
  const url = "/api/pages/events";
  return await fetch(url, {
    method: "POST", cache: "no-cache",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), 
  })
}

const createEvent = (d) => { 
  postEvent(d).then(() => {
    console.log('POSTED');
  }).catch((e) => {
    console.error(e);
  })

  if (!d.tests.event_test.hidden) {
    d.tests.event_test.hidden = true;
    d.tests.event_test.forms = [];
    return d;
  }
  d.tests.event_test.hidden = false;
  d.tests.event_test.forms = [[{
    legend: 'Event Info', 
    style: `
      ${T.center} ${T.flex_fit} gap: 0.5rem;
    `,
    name: 'info', 
    fields: [
      { name: "name" },
      { name: "intro" },
      { name: "venue" },
      { name: "person" },
      { name: "status" },
    ]
  }, {
    legend: 'Schedule (US Eastern Time)',
    style: `
      ${T.center} ${T.flex_fit} gap: 0.5rem;
    `,
    name: 'schedule',
    fields: [
      { name: "start_time" },
      { name: "end_time" },
      { name: "date", readonly: true, class: "date" },
      { name: "calendar" },
    ]
  }]];
  return d;
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
      height: 100%;
      padding: 0.5rem;
      overflow: scroll;
      grid-template-columns: 1fr minmax(300px, 90vw) 1fr;
      grid-template-rows: 1fr auto 6fr;
      font-family: Optima, Candara, sans-serif;
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
      grid-row: 2;
      display: grid;
      font-size: 125%;
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

const toField = (field, key) => {
  const { Input, Label } = ArrowTags;
  if (field.name === "calendar") {
    return toCalendar(field);
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
  const type = {
    "status": "checkbox",
    "end_time": "time",
    "start_time": "time",
    "date": "date"
  }[field.name] || "text"
  const for_time = ["", `
    display: grid;
    align-content: stretch;
    justify-content: stretch;
    grid-template-columns: auto 1fr;
  `][+(type === "time")];
  const for_editable = [`
    ${T.b_corn}
  `, `
    ${T.b_light}
    box-shadow: -2px 2px 6px 0px rgba(0,0,0,0.75) inset;
  `][+!field.readonly];
  const inp = Input()({ 
    ...field, type,
    style: [`
      ${for_time}
      ${for_editable}
      border: none;
      font-size: 150%;
      padding: 0.5rem;
      border-radius: 0.25rem;
    `, ""][+(type === "checkbox")],
  });
  const for_checkbox = [
    "", `
      ${T.center}
      line-height: 300%;
      text-align: center;
      grid-template-columns: 1fr 1fr;
    `
  ][+(type === "checkbox")];
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

const toFieldset = (fieldset, key) => {
  const { Legend, Fieldset, Input } = ArrowTags;
  const leg_props = { style: `font-size: 125%` };
  const leg = Legend`${() => fieldset.legend}`(leg_props);
  const fs = fieldset.fields.map(toField);
  const submit = Input()({
    value: `Update ${fieldset.name}`,
    name: fieldset.name,
    type: "submit",
    style: `
      ${T.button_submit}
    `
  });
  const props = {
    style: fieldset.style,
    html, key
  }
  return Fieldset(leg, ...fs, submit)(props);
}

const toForm = (cal_id) => {
  return (form, key) => {
    const { Form } = ArrowTags;
    const fs = form.map(toFieldset);
    const props = {
      html, key,
      style: `
        display: grid;
        gap: 0.5rem;
      `,
      "@submit": (e) => {
        console.log([...new FormData(e.target).entries()].map(a => a.join('=')).join(' '));
        e.preventDefault();
      }
    }
    return Form(...fs)(props);
  }
}

const toHiddenForm = (d, ev_fn) => {
  const form = ev_fn(d);
  return form ? [ form ] : [];
}

const toSection = (pre, cal_id, d) => {
  return ([h2, ev_fn], idx) => {
    const styles = [ `${T.t_off}`, `${T.t_on}` ];
    const { Div } = ArrowTags;
    const to_style = (d) => {
      return styles[+!ev_fn(d).hidden];
    }
    const key = `${pre} ${idx}`;
    const props = {
      html, key, style: to_style
    }
    const form = ev_fn(d).forms.map(toForm(cal_id));
    return Div(`<h2>${h2}</h2>`, ...form)(props);
  }
}

const toSectionsPrefix = (d) => {
  return [...Object.values(d.tests)].map(v => v.hidden).join(' ');
}

const toSections = (cal_id) => {
  return (d) => {
    const pre = toSectionsPrefix(d);
    const prefix = 'API Endpoint: ';
    const labels = [...Object.entries({
      "Events": () => {
        return d.tests.event_test;
      },
      "People": () => {
        return d.tests.event_person;
      },
      "Sites + People": () => {
        return d.tests.event_basic;
      },
      "Surveys + Contact": () => {
        return d.tests.event_survey;
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
    `
  }
  return Div`${fn}`(props);
}

const toNavItems = (pre, d) => {
  const out = [[
      () => {
        const { hidden } =  d.tests.event_test;
        return ['New Event', 'Hide Event'][+!hidden];
      },
      { '@click': ev(createEvent, d) }
    ],[
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
      ${T.button_on}
      border: none;
      width: 100%;
      height: 2em;
      font-size: inherit;
      cursor: pointer;
      font-family: inherit;
      padding: 0.5rem 1rem;
          `
    const props = { ...opts, html, style, key };
    const { Button } = ArrowTags;
    return Button`${fn}`(props);
  }
}

const toDefaultEvent = () => {
    return { forms: [], hidden: true };
}
const toDefault = () => {
  return {
    n: -1,
    msg: 'Welcome',
    who: 'John',
    tests: {
      event_test: toDefaultEvent(),
      event_person: toDefaultEvent(),
      event_basic: toDefaultEvent(),
      event_survey: toDefaultEvent()
    }
  }
}

const toPages = async (d) =>  {
  const response = await fetch("/api/pages/basic_pages");
  const { results } = await response.json();
  d.n = results.length;
}

const updateCal = (e) => {
  // get parent of e target
  const fieldset = e.target.parentElement;
  const input = fieldset.getElementsByClassName("date")[0];
  input.valueAsDate = getLitDate(e.target.id);
}
const observe = (id1, id2) => {
  // Handle shadow dom of id2
  const el = document.getElementById(id1);
  new MutationObserver(() => {
    const root = document.getElementById(id2)?.shadowRoot;
    if (!root) return;
    // Handle events
    const event_name = 'user-selected-date-changed';
    root.host.addEventListener(event_name, updateCal);
    setLitDate(id2, new Date(12341231241234));
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
        ${T.button_on} ${T.center}
        grid-template-columns: 1fr auto 1fr;
      }
      table.calendar__grid button[previous-month],
      table.calendar__grid button[next-month] {
        ${T.button_off} ${T.b_corn} ${T.t_off}
      }
      table.calendar__grid button {
        ${T.button_on}
        font-size: 120%;
        width: 100%;
      }
      table.calendar__grid button[selected] {
        ${T.select}
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
  observe(id, cal_id);
  const data = reactive(toDefault());
  const { render } = ArrowTags;
  const toLabel = d => {
   return toNavItems('test', d);
  }
  const nav = toPageNav(toLabel);
  const core = toPageCore(toSections(cal_id));
  const root = toRoot(nav, core);
  render(id, html, data, root);
  toPages(data);

}

export default main
