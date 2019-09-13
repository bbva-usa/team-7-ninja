import { html, LitElement, css } from 'lit-element';
import { Services } from './services';

class BrDrawer extends LitElement {
  static get properties() {
    return {
      schools: { type: Array },
      _selecedSchool: { type: Object },
      _selectedRoute: { type: Object },
    };
  }

  static get styles() {
    return [
      css`
        .drawer-list > [selected] {
          color: var(--app-drawer-selected-color);
        }

        [selected] {
          color: var(--app-drawer-selected-color);
        }

        [card-selected] {
          border: 0.5px solid var(--app-secondary-color);
        }

        .drawer-list > h2 {
          color: var(--app-drawer-text-color);
        }

        .drawer-list > a {
          display: block;
          text-decoration: none;
          color: var(--app-drawer-text-color);
          line-height: 40px;
          padding: 0 24px;
          font-size: 12pt;
          cursor: pointer;
        }

        .drawer-list > [routes] {
          display: block;
          color: var(--app-drawer-text-color);
          line-height: 40px;
          padding: 0 40px;
          font-size: 10pt;
          cursor: pointer;
        }

        .drawer-list {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          padding: 24px;
          background: #fff;
          position: relative;
        }

        paper-card {
          padding: 5%;
          margin: 3%;
          border-radius: 5px;
          cursor: pointer;
        }

        #title {
          color: black !important;
        }

        .slide-bottom {
          padding-top: 3%;
          padding-left: 2%;
        }

        @media (max-width: 460px) {
          #title {
            text-align: center;
          }

          paper-card {
            text-align: center;
            width: 100%;
            margin-left: auto;
            margin-right: auto;
          }

          .drawer-list {
            padding-top: 0;
          }

          .drawer-list > h2 {
            font-size: 14pt;
          }
        }
      `,
    ];
  }

  constructor() {
    super();

    this._selecedSchool = {};
    this._selectedRoute = {};
    this.schools = [];
  }

  render() {
    return html`
      <nav class="drawer-list">
        <h2 id="title">Fairfield Bus Routes</h2>
        ${this.schools.map(this._getSchoolCard.bind(this))}
      </nav>
    `;
  }

  _getSchoolCard(school) {
    return html`
      <paper-card
        ?card-selected="${this._isSchoolSelected(school.school_id)}">
        <a id="${school.school_id}" @click="${this._schoolClicked}" ?selected="${this._isSchoolSelected(school.school_id)}">
          ${school.school_ds}
        </a>
        ${this._isSchoolSelected(school.school_id) ? this._getRouteList(school) : ''}
      </paper-card>`;
  }

  _getRouteList(school) {
    return html`
      <div
        routes
        class="slide-bottom">
        ${school.routes.map((r) => html`
          <div
            class=""
            ?selected="${this._isRouteSelected(r.route_id)}"
            @click="${this._routeClicked.bind(this, school.school_id, r.route_id)}">
            ${r.route_ds}
          </div>`)}
      </div>`;
  }

  _isSchoolSelected(schoolId) {
    return schoolId === this._selecedSchool.school_id;
  }

  _isRouteSelected(routeId) {
    return routeId === this._selectedRoute.route_id;
  }

  _schoolClicked({ target: { id } }) {
    this._selecedSchool = this.schools.find((r) => r.school_id === id);
  }

  _routeClicked(schoolId, routeId) {
    Services
      .routes
      .getRouteBySchoolId(schoolId, routeId)
      .then((route) => {
        this._selectedRoute = route;
        this.dispatchEvent(new CustomEvent('selected-route-changed', { detail: route }));
      });
  }
}

window.customElements.define('br-drawer', BrDrawer);
