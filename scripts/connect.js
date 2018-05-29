// Copyright (c) 2010-2018 Quadralay Corporation.  All rights reserved.
//
// ePublisher 2018.1
//
// Validated with JSLint <http://www.jslint.com/>
//

/*jslint browser: true, for: true, this: true, white: true */
/*global window */
/*global Browser */
/*global Message */
/*global FAJAX */
/*global Parcels */
/*global Progress_Object */

var Connect_Window = window;
Connect_Window.name = 'connect_main';

// AJAXData
//

function AJAXData_Execute() {
  'use strict';

  var this_ajaxdata, entry, ajax, parallel, request_url, moment;

  this_ajaxdata = this;
  if (this_ajaxdata.entries.length > 0) {
    // Load entry
    //
    entry = this_ajaxdata.entries.shift();
    if (Connect_Window.document.location.protocol === 'file:') {
      ajax = new FAJAX.Object(Connect_Window);
      parallel = false;
    } else {
      ajax = Browser.GetAJAX(Connect_Window);
      parallel = true;
    }

    ajax.onreadystatechange = function () {
      if (ajax.readyState === 4) {
        // Entry retrieved
        //
        if (ajax.status === 200) {
          // Success!
          //
          this_ajaxdata.completed_entries.push(entry);
          this_ajaxdata.success(entry, ajax);

          // Update progress
          //
          this_ajaxdata.progress((this_ajaxdata.completed_entries.length / this_ajaxdata.entries_start_length) * 100);
        } else if (ajax.status === 304) {
          // Already trying to work around 304s?
          //
          if (this_ajaxdata.avoid_304_entries[entry] === true) {
            // Keep moving forward
            //
            this_ajaxdata.completed_entries.push(entry);
            this_ajaxdata.progress((this_ajaxdata.completed_entries.length / this_ajaxdata.entries_start_length) * 100);
          } else {
            // Retry
            //
            this_ajaxdata.avoid_304_entries[entry] = true;
            this_ajaxdata.entries.push(entry);
          }
        } else {
          this_ajaxdata.completed_entries.push(entry);
        }

        // Load next entry
        //
        Connect_Window.setTimeout(function () {
          this_ajaxdata.Execute();
        }, 1);
      }
    };

    // Avoid 304 (not modified) responses
    //
    request_url = this_ajaxdata.get_url(entry);
    if (this_ajaxdata.avoid_304_entries[entry] === true) {
      moment = new Date();
      request_url += '?moment=' + moment.getTime();
    }

    // Request entry
    //
    ajax.open('GET', request_url, true);
    ajax.send(null);

    // Parallel load?
    //
    if (parallel) {
      // Load next entry
      //
      Connect_Window.setTimeout(function () {
        this_ajaxdata.Execute();
      }, 1);
    }
  } else {
    // Completed?
    //
    if ((this.completed === false) && (this_ajaxdata.completed_entries.length === this_ajaxdata.entries_start_length)) {
      // Entries loaded!
      //
      this_ajaxdata.complete();

      this.completed = true;
    }
  }
}

function AJAXData_Object(param_entries, param_get_url, param_progress, param_success, param_complete) {
  'use strict';

  this.entries = param_entries.slice(0);
  this.entries_start_length = this.entries.length;
  this.completed_entries = [];
  this.completed = false;
  this.avoid_304_entries = {};
  this.get_url = param_get_url;
  this.progress = param_progress;
  this.success = param_success;
  this.complete = param_complete;

  this.Execute = AJAXData_Execute;
}

// Lightbox
//

function Lightbox_Show() {
  'use strict';

  // Set up the background
  //
  this.lightbox_background.style.display = 'block';

  // Configure the frame
  //
  this.lightbox_frame.style.visibility = 'visible';
}

function Lightbox_Hide() {
  'use strict';

  // Hide lightbox
  //
  this.lightbox_frame.style.visibility = 'hidden';
  this.lightbox_background.style.display = 'none';

  // Teardown
  //
  if ((this.teardown !== undefined) && (this.teardown !== null)) {
    this.teardown(this.lightbox_frame, this.lightbox_content);
    this.teardown = undefined;
  }
}

function Lightbox_Display(param_setup, param_teardown) {
  'use strict';

  var this_lightbox;

  // Setup
  //
  param_setup(this.lightbox_frame, this.lightbox_content);

  // Configure teardown
  //
  this.teardown = param_teardown;

  // Show!
  //
  this_lightbox = this;
  Connect_Window.setTimeout(function () {
    this_lightbox.Show();
  }, 1);
}

function Lightbox_Object(param_connect) {
  'use strict';

  var this_lightbox;

  this.connect = param_connect;

  this.lightbox_background = Connect_Window.document.getElementById('lightbox_background');
  this.lightbox_frame = Connect_Window.document.getElementById('lightbox_frame');
  this.lightbox_content = Connect_Window.document.getElementById('lightbox_content');
  this.lightbox_close = Connect_Window.document.getElementById('lightbox_close');
  this.teardown = undefined;

  this_lightbox = this;
  this.page_iframe = Connect_Window.document.getElementById('page_iframe');
  this.lightbox_close.onclick = function () {
    this_lightbox.Hide();
  };

  this.Show = Lightbox_Show;
  this.Hide = Lightbox_Hide;
  this.Display = Lightbox_Display;

  // Use fancy, centered display?
  //
  if (this.lightbox_frame.style.transform !== undefined) {
    this.lightbox_frame.className = Browser.AddClass(this.lightbox_frame.className, 'ww_skin_lightbox_frame_centered');
  }
}

var Connect = { loading: false, page_cargo: {} };

Connect.OnLoadAction = function () {
  'use strict';

  var url_header, base_pathname, base_url, splash_page_url,
    progress_bar_div, back_to_top_link, parcel_anchors, parcel_anchor,
    parcel_context_and_id, parcel_context, parcel_id, index;

  // Account for # in pathname and href as well as root (site) URL case
  //
  base_pathname = Connect_Window.location.pathname;
  if (base_pathname.indexOf('#') > 0) {
    base_pathname = base_pathname.substring(0, base_pathname.lastIndexOf('#'));
  }
  base_pathname = base_pathname.substring(0, base_pathname.lastIndexOf('/') + 1);
  if (base_pathname.length === 1) {
    base_pathname = '';
  }
  url_header = Connect_Window.location.href;
  if (url_header.indexOf('#') > 0) {
    url_header = url_header.substring(0, url_header.lastIndexOf('#'));
  }
  if (base_pathname.length > 0) {
    url_header = url_header.substring(0, url_header.lastIndexOf(base_pathname));
  }
  base_url = url_header + base_pathname;
  splash_page_url = base_url + 'connect/splash.html';

  Connect.base_url = base_url;
  Connect.default_page_url = splash_page_url;
  Connect.splash_page_url = splash_page_url;
  Connect.search_page_url = base_url + 'connect/search.html';
  Connect.search_url = base_url;
  Connect.url_handler_object = Connect.CreateHandlerObject();
  Connect.show_first_document = false;
  Connect.layout_initialized = false;
  Connect.layout_wide = false;
  Connect.layout_tall = false;
  Connect.adjust_for_content_size_timeout = null;
  Connect.adjust_for_content_size_inprogress = false;
  Connect.parcels_loaded_initial = false;
  Connect.parcels_loading_remaining = false;
  Connect.parcels_loaded_all = false;
  Connect.ignore_page_load = false;
  Connect.hash = '';
  Connect.progress_div = Connect_Window.document.getElementById('progress');
  Connect.progress = new Progress_Object(Connect.progress_div);
  Connect.parcel_anchors = [];
  Connect.parcel_ids = [];
  Connect.parcel_ix = [];
  Connect.parcel_ix_loaded = false;
  Connect.parcel_ix_loading = false;
  Connect.parcel_sx = [];
  Connect.parcel_title = {};
  Connect.navigation_width = parseFloat(window.getComputedStyle(document.getElementById("menu_frame"), null)["width"]);
  Connect.navigation_minimum_page_width = 900;
  Connect.minimum_page_height = 400;
  Connect.lightbox_large_images = true;
  Connect.disqus_id = 'afrench';
  Connect.email = '';
  Connect.email_message = 'Feedback: $Location;';
  Connect.footer_end_of_layout = true;
  Connect.toc_class_states = {};
  Connect.toc_selected_entry_key = undefined;
  Connect.toc_cleanup_folders = true;
  Connect.search_input = null;
  Connect.search_query = '';
  Connect.search_title = 'Search';
  Connect.search_scope_all_label = 'All';
  Connect.search_synonyms = '';
  Connect.search_query_minimum_length = 4;
  Connect.progressive_search_enabled = true;
  Connect.button_behavior_expression = new RegExp('ww_behavior_[a-z]+', 'g');
  Connect.buttons = {};
  Connect.button_behaviors = {
    'ww_behavior_home': Connect.Button_Home,
    'ww_behavior_toc': Connect.Button_TOC,
    'ww_behavior_index': Connect.Button_Index,
    'ww_behavior_search': Connect.Button_Search,
    'ww_behavior_globe': Connect.Button_Globe,
    'ww_behavior_prev': Connect.Button_Previous,
    'ww_behavior_next': Connect.Button_Next,
    'ww_behavior_email': Connect.Button_Email,
    'ww_behavior_print': Connect.Button_Print,
    'ww_behavior_pdf': Connect.Button_PDF,
    'ww_behavior_logo_link_home': Connect.Button_Home,
    'ww_behavior_logo_link_external': Connect.Button_External,
    'ww_behavior_menu': Connect.Button_Menu_Toggle,
    'ww_behavior_back_to_top': Connect.BackToTopLink
  };
  Connect.button_degradation_order = [/*'ww_behavior_globe', 'ww_behavior_home'*/]; // not sure if we want this anymore
  Connect.page_first_scroll = true;
  Connect.globe_enabled = false;
  Connect.google_analytics_enabled = typeof Analytics !== 'undefined';

  Connect.link_bridge = {
    Next: {},
    Prev: {},
    HREFs: { 'splash': splash_page_url },

    Update: function () {
      var previous_last_page_link, index, parcel_id, first_page_div, last_page_div, first_page_link, last_page_link, firstPageID, lastPageID, lastLinkID;

      // Reset info
      //
      this.Next = {};
      this.Prev = {};
      this.HREFs = { 'splash': splash_page_url };

      // Update "bridge" links
      //
      previous_last_page_link = null;
      for (index = 0; index < Connect.parcel_ids.length; index += 1) {
        parcel_id = Connect.parcel_ids[index];

        first_page_div = Connect_Window.document.getElementById('page:' + parcel_id + ':first');
        last_page_div = Connect_Window.document.getElementById('page:' + parcel_id + ':last');
        if ((first_page_div !== null) && (last_page_div !== null)) {
          first_page_link = Browser.FirstChildElementWithTagName(first_page_div, 'a');
          last_page_link = Browser.FirstChildElementWithTagName(last_page_div, 'a');

          firstPageID = first_page_link.id.replace(/\:first$/, '');
          lastPageID = last_page_link.id.replace(/\:last$/, '');

          // Associate previous/next and handle no splash
          //
          if (previous_last_page_link === null) {
            if (Connect.show_first_document) {
              Connect.default_page_url = first_page_link.href;
            } else {
              this.Prev[firstPageID] = 'splash';
            }
            this.Next['splash'] = firstPageID;
          } else {
            lastLinkID = previous_last_page_link.id.replace(/\:last$/, '');
            this.Prev[firstPageID] = lastLinkID;
            this.Next[lastLinkID] = firstPageID;
          }

          // Map ids to URIs
          //
          this.HREFs[firstPageID] = first_page_link.href;
          this.HREFs[lastPageID] = last_page_link.href;

          previous_last_page_link = last_page_link;
        }
      }
    },

    GetPrev: function (param_page_id) {
      var result;

      result = null;

      if (this.Prev[param_page_id] !== undefined) {
        result = this.HREFs[this.Prev[param_page_id]];
      }

      return result;
    },

    GetNext: function (param_page_id) {
      var result;

      result = null;

      if (this.Next[param_page_id] !== undefined) {
        result = this.HREFs[this.Next[param_page_id]];
      }

      return result;
    },

    Get: function (param_type, param_page_id) {
      var result, type_as_lowercase;

      result = null;

      type_as_lowercase = param_type.toLowerCase();
      if (type_as_lowercase === 'prev') {
        result = this.GetPrev(param_page_id);
      } else if (type_as_lowercase === 'next') {
        result = this.GetNext(param_page_id);
      }

      return result;
    }
  };

  // Cache <div>s
  //
  Connect.layout_div = Connect_Window.document.getElementById('layout_div');
  Connect.toolbar_div = Connect_Window.document.getElementById('toolbar_div');
  Connect.presentation_div = Connect_Window.document.getElementById('presentation_div');
  Connect.parcels_div = Connect_Window.document.getElementById('parcels');
  Connect.container_div = Connect_Window.document.getElementById('container_div');
  Connect.menu_frame_div = Connect_Window.document.getElementById('menu_frame');
  Connect.page_div = Connect_Window.document.getElementById('page_div');
  Connect.page_iframe = Connect_Window.document.getElementById('page_iframe');
  Connect.panels_div = Connect_Window.document.getElementById('panels');
  Connect.nav_buttons_div = Connect_Window.document.getElementById('nav_buttons_div');
  Connect.toc_div = Connect_Window.document.getElementById('toc');
  Connect.toc_content_div = Connect_Window.document.getElementById('toc_content');
  Connect.index_div = Connect_Window.document.getElementById('index');
  Connect.index_content_div = Connect_Window.document.getElementById('index_content');
  Connect.search_div = Connect_Window.document.getElementById('search_div');
  Connect.search_content_div = Connect_Window.document.getElementById('search_content');
  Connect.search_iframe = Connect_Window.document.getElementById('search_iframe');
  Connect.search_input = Connect_Window.document.getElementById('search_input');
  Connect.footer_div = Connect_Window.document.getElementById('footer_div');
  Connect.modal_container_div = Connect_Window.document.getElementById('modal_container');
  Connect.modal_close_button = Connect_Window.document.getElementById("modal_close");
  Connect.modal_retry_button = Connect_Window.document.getElementById("retry_btn");

  Connect.modal_container_div.onclick = Modal.Close;
  Connect.modal_close_button.onclick = Modal.Close;
  Connect.modal_retry_button.onclick = Modal.Retry;


  // Menu
  //
  Connect.Menu = new Menu_Object(Connect_Window, Connect);
  Connect.sidebar_behavior = undefined;

  // Search Scope
  //
  Connect.scope_enabled = typeof Scope !== 'undefined';
  if (Connect.scope_enabled) {
    Connect.search_scope_selector = document.getElementById('search_scope');
    Connect.search_scope_selector.onclick = Scope.ToggleDropDown;
  }

  // Progressive Search
  //
  Connect.search_input.oninput = function () {
    Connect.search_query = Connect.search_input.value;
    if (Connect.progressive_search_enabled) {
      if (Connect.search_query.length >= Connect.search_query_minimum_length ||
        (Connect.search_query.length === 0 && Connect.SearchEnabled())) {
        Connect.HandleSearchURL();
      }
    }
  }

  // Scroll Events
  //
  Connect.container_div.onscroll = function () {
    Connect.Menu.CalculateMenuSize();
    Connect.HandleScrollForBackToTop();
  }

  // Create progress for index panel
  //
  progress_bar_div = Browser.FirstChildElementContainingClass(Connect.progress_div, 'ww_skin_progress_bar');
  Connect.index_progress_div = Connect_Window.document.getElementById('panel_progress').cloneNode(true);
  Connect.index_progress_div.id = '';
  Connect.index_progress_div.innerHTML = '';
  Connect.index_progress_div.appendChild(progress_bar_div.cloneNode(true));
  Connect.panels_div.appendChild(Connect.index_progress_div);
  Connect.index_progress = new Progress_Object(Connect.index_progress_div);
  Connect.index_progress.Hide();

  // Create progress for search panel
  //
  //
  Connect.search_progress_div = Connect_Window.document.getElementById('panel_progress').cloneNode(true);
  Connect.search_progress_div.id = '';
  Connect.search_progress_div.innerHTML = '';
  Connect.search_progress_div.appendChild(progress_bar_div.cloneNode(true));
  Connect.panels_div.appendChild(Connect.search_progress_div);
  Connect.search_progress = new Progress_Object(Connect.search_progress_div);
  Connect.search_progress.Hide();

  // Determine scrolling support
  //
  Connect.scrolling_supported = Browser.ScrollingSupported();
  if (Connect.scrolling_supported) {
    Connect_Window.document.body.className = Browser.AddClass(Connect_Window.document.body.className, 'scrolling_supported');
  }

  // Size content <div>
  //
  Connect_Window.onresize = Connect.OnResize;
  if (Connect_Window.addEventListener !== undefined) {
    Connect_Window.addEventListener('orientationchange', Connect.OnResize, false);
  }

  // Lightbox
  //
  Connect.Lightbox = new Lightbox_Object(Connect);

  // Touch enabled?
  //
  if (Browser.TouchEnabled(Connect_Window)) {
    // Adjust CSS rules for touch devices
    //
    Browser.DisableCSSHoverSelectors(Connect_Window);
  }

  // Hook up back to top
  //
  Connect.back_to_top_element = Connect_Window.document.getElementById('back_to_top');
  if (Connect.back_to_top_element !== null) {
    Connect.back_to_top_element.onclick = Connect.BackToTop;

    back_to_top_link = Browser.FirstChildElementWithTagName(Connect.back_to_top_element, 'a');
    if ((back_to_top_link !== null) && (Browser.ContainsClass(back_to_top_link.className, 'ww_behavior_back_to_top'))) {
      back_to_top_link.onclick = Connect.BackToTopLink;
    }
  }

  // Load parcels
  //
  Connect.parcels_initial_html = Connect.parcels_div.innerHTML;
  Connect.Parcels_PrepareForLoad();
  Connect.Parcels_Load();

  // Load Search Page
  //
  Connect.LoadSearchPage();

  // Setup for listening
  //
  Connect.dispatch_listen = undefined;
  Message.Listen(Connect_Window, Connect.Listen);
};

Connect.OnLoad = function () {
  'use strict';

  if (!Connect.BrowserSupported()) {
    Connect.DisplayUnsupportedBrowserView();
    return;
  }

  if (!Connect.loading) {
    Connect.loading = true;
    Connect.OnLoadAction();
  }
};

// Start running as soon as possible
//
if (window.addEventListener !== undefined) {
  window.document.addEventListener('DOMContentLoaded', Connect.OnLoad, false);
}

Connect.AddParcel = function (param_parcel_context,
  param_parcel_id,
  param_parcel_url,
  param_parcel_title) {
  'use strict';

  var parcel_directory_url;

  parcel_directory_url = param_parcel_url.substring(0, param_parcel_url.lastIndexOf('.'));

  // Track context
  //
  Connect.parcel_context_ids[param_parcel_context] = param_parcel_id;

  // Include original file and directory prefix
  //
  Connect.parcel_prefixes[param_parcel_url] = true;
  Connect.parcel_prefixes[parcel_directory_url] = true;
  Connect.parcel_ix.push({ 'id': param_parcel_id, 'url': parcel_directory_url + '_ix.html' });
  Connect.parcel_sx.push(parcel_directory_url + '_sx.js');
  Connect.parcel_title[param_parcel_id] = param_parcel_title;
};

Connect.KnownParcelURL = function (param_url) {
  'use strict';

  var result;

  result = Parcels.KnownParcelURL(Connect.parcel_prefixes, param_url);

  return result;
};

Connect.KnownParcelBaggageURL = function (param_url) {
  'use strict';

  var result;

  result = Parcels.KnownParcelBaggageURL(Connect.parcel_prefixes, param_url);

  return result;
};

Connect.CalculateLayoutWide = function () {
  'use strict';

  var result, browser_widthheight;

  browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);
  result = (browser_widthheight.width >= Connect.navigation_minimum_page_width);

  return result;
};

Connect.CalculateLayoutTall = function () {
  'use strict';

  var result, browser_widthheight;

  browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);

  result = (browser_widthheight.height >= Connect.minimum_page_height) || (browser_widthheight.height > browser_widthheight.width);

  return result;
};

Connect.AdjustLayoutForBrowserSize = function () {
  'use strict';

  var previous_layout_wide, previous_layout_tall, layout_changed,
    toolbar_buttons, left_button, right_button, index,
    toolbar_button;

  // Adjust navigation based on available space
  //
  previous_layout_wide = Connect.layout_wide;
  previous_layout_tall = Connect.layout_tall;
  Connect.layout_wide = Connect.CalculateLayoutWide();
  Connect.layout_tall = ((!Connect.layout_wide) && (Connect.CalculateLayoutTall()));
  layout_changed = ((!Connect.layout_initialized) || (Connect.layout_wide !== previous_layout_wide) || (Connect.layout_tall !== previous_layout_tall));

  // Layout changed?
  //
  if (layout_changed) {
    if (Connect.layout_wide) {
      // Layout
      //
      Connect.layout_div.className = 'layout_wide';
    } else {
      if (Connect.layout_tall) {
        // Layout
        //
        Connect.layout_div.className = 'layout_narrow layout_tall';
      } else {
        // Layout
        //
        Connect.layout_div.className = 'layout_narrow';
      }
    }
  }

  // Update toolbar buttons
  //
  toolbar_buttons = Connect.toolbar_div.getElementsByTagName('span');
  for (index = 0; index < toolbar_buttons.length; index += 1) {
    toolbar_button = toolbar_buttons[index];
    if ((Browser.ContainsClass(toolbar_button.className, 'ww_skin_toolbar_button_left')) ||
      (Browser.ContainsClass(toolbar_button.className, 'ww_skin_toolbar_button_center')) ||
      (Browser.ContainsClass(toolbar_button.className, 'ww_skin_toolbar_button_right'))) {
      if (left_button === undefined) {
        left_button = toolbar_button;
      }
      right_button = toolbar_button;
    }
  }
  if (left_button !== undefined) {
    if (Connect.layout_wide) {
      left_button.className = Browser.AddClass(left_button.className, 'ww_skin_toolbar_left_background');
    } else {
      left_button.className = Browser.RemoveClass(left_button.className, 'ww_skin_toolbar_left_background');
    }
  }
  if (right_button !== undefined) {
    if (Connect.layout_wide) {
      right_button.className = Browser.AddClass(right_button.className, 'ww_skin_toolbar_right_background');
    } else {
      right_button.className = Browser.RemoveClass(right_button.className, 'ww_skin_toolbar_right_background');
    }
  }

  if (Connect.sidebar_behavior !== undefined) {
    Connect.button_behaviors[Connect.sidebar_behavior]();
  }
  // Initialized layout
  //
  Connect.layout_initialized = true;
};

Connect.HandleToolbarButtonForBrowserSize = function (param_index, param_show) {
  'use strict';

  var done, button_behavior, toolbar_button, browser_widthheight,
    toolbar_table_element, toolbar_table_widthheight;

  done = false;

  // Possible button to show/hide
  //
  button_behavior = Connect.button_degradation_order[param_index];
  toolbar_button = Connect.buttons[button_behavior];
  if (toolbar_button !== undefined) {
    // Show/hide
    //
    if (param_show) {
      toolbar_button.style.display = 'inline-block';
    } else {
      toolbar_button.style.display = 'none';
    }

    // Keep change?
    //
    browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);
    toolbar_table_element = Browser.FirstChildElementWithTagName(Connect.toolbar_div, 'table');
    toolbar_table_widthheight = Browser.GetElementWidthHeight(toolbar_table_element);
    if (param_show) {
      if (toolbar_table_widthheight.width > browser_widthheight.width + 1) {
        // Revert change
        //
        toolbar_button.style.display = 'none';
        done = true;
      }
    } else {
      if (toolbar_table_widthheight.width <= browser_widthheight.width + 1) {
        // Met the goal size
        //
        done = true;
      }
    }
  }

  return done;
};

Connect.AdjustToolbarForBrowserSize = function () {
  'use strict';

  var browser_widthheight, toolbar_table_element,
    toolbar_table_widthheight, show, index, done;

  // Show/hide non-critical toolbar buttons based on available space
  //
  browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);
  toolbar_table_element = Browser.FirstChildElementWithTagName(Connect.toolbar_div, 'table');
  toolbar_table_widthheight = Browser.GetElementWidthHeight(toolbar_table_element);
  show = (toolbar_table_widthheight.width <= browser_widthheight.width + 1);
  if (show) {
    // Show buttons in reverse order
    //
    for (index = Connect.button_degradation_order.length - 1; index >= 0; index -= 1) {
      done = Connect.HandleToolbarButtonForBrowserSize(index, show);
      if (done) {
        break;
      }
    }
  } else {
    // Hide buttons in default order
    //
    for (index = 0; index < Connect.button_degradation_order.length; index += 1) {
      done = Connect.HandleToolbarButtonForBrowserSize(index, show);
      if (done) {
        break;
      }
    }
  }
};

Connect.AdjustForContentSize = function () {
  'use strict';

  // Halt adjustment requests
  //
  if (Connect.adjust_for_content_size_timeout !== null) {
    Connect_Window.clearTimeout(Connect.adjust_for_content_size_timeout);
    Connect.adjust_for_content_size_timeout = null;
  }

  // Serialize adjustments
  //
  if (!Connect.adjust_for_content_size_inprogress) {
    Connect.adjust_for_content_size_inprogress = true;

    Connect_Window.setTimeout(function () {
      // Adjust navigation based on available space
      //
      Connect.AdjustLayoutForBrowserSize();

      Connect_Window.setTimeout(function () {
        // Adjust toolbar
        //
        Connect.AdjustToolbarForBrowserSize();

        Connect_Window.setTimeout(function () {
          // Update page height
          //
          Connect.UpdatePageHeight();

          Connect.adjust_for_content_size_inprogress = false;
        }, 1);
      }, 1);
    }, 1);
  }
};

Connect.OnResize = function () {
  'use strict';

  // Adjust for content size
  //
  if (Connect.adjust_for_content_size_timeout !== null) {
    Connect_Window.clearTimeout(Connect.adjust_for_content_size_timeout);
  }
  Connect.adjust_for_content_size_timeout = Connect_Window.setTimeout(Connect.AdjustForContentSize, 100);
};

Connect.Parcels_AddData = function (param_entry, param_ajax) {
  'use strict';

  var parcel_div, parcel_context_and_id, parcel_id,
    parcel_toc_div_id, parcel_toc_div, parcel_toc_ul,
    toc_layout_li, level_offset, parcel_data_div_id,
    parcel_data_div;

  // Access parcel
  //
  parcel_div = Connect_Window.document.createElement('div');
  parcel_div.style.visibility = 'hidden';
  parcel_div.innerHTML = param_ajax.responseText;
  Connect_Window.document.body.appendChild(parcel_div);

  // Add to collection of valid parcels
  //
  parcel_context_and_id = param_entry.id.split(':');
  parcel_id = parcel_context_and_id[1];

  // TOC
  //
  parcel_toc_div_id = 'toc:' + parcel_id;
  parcel_toc_div = Connect_Window.document.getElementById(parcel_toc_div_id);
  if (parcel_toc_div !== null) {
    parcel_toc_ul = Browser.FirstChildElementWithTagName(parcel_toc_div, 'ul');
    if (parcel_toc_ul !== null) {
      // Extract TOC data
      //
      if (Connect.parcel_ids.length === 1) {
        // Suppress parcel (group) folder
        //
        toc_layout_li = param_entry.parentNode.parentNode.parentNode.parentNode;
      } else {
        // Preserve parcel (group) folder
        //
        toc_layout_li = param_entry.parentNode.parentNode;
      }

      // Ensure TOC data initially collapsed when appended
      //
      parcel_toc_ul.className = 'ww_skin_toc_container_closed';
      toc_layout_li.appendChild(parcel_toc_ul);

      // Configure TOC levels
      //
      if (Connect.parcel_ids.length === 1) {
        Connect.ConfigureTOCLevels(Connect.toc_div, 0);
      } else {
        level_offset = Connect.DetermineTOCLevel(Connect.toc_div, toc_layout_li) - 1;
        Connect.ConfigureTOCLevels(toc_layout_li, level_offset);
      }
    }
  }

  // Data
  //
  parcel_data_div_id = 'data:' + parcel_id;
  parcel_data_div = Connect_Window.document.getElementById(parcel_data_div_id);
  if (parcel_data_div !== null) {
    Connect.parcels_div.appendChild(parcel_data_div);
  }

  // Remove parcel data
  //
  Connect_Window.document.body.removeChild(parcel_div);

  // Disable parcel link
  //
  if (Connect.parcel_ids.length === 1) {
    param_entry.parentNode.parentNode.parentNode.parentNode.removeChild(param_entry.parentNode.parentNode.parentNode);
  } else {
    Browser.RemoveAttribute(param_entry, 'href', '');
  }

  // Update "bridge" links
  //
  Connect.link_bridge.Update();

  // Update prev/next
  //
  Connect.UpdatePrevNext();
};

Connect.Parcels_DetermineRequiredAndRemaining = function () {
  'use strict';

  var result, context_signature,
    context_and_topic, topic_index,
    page_signature, page_base_relative_url,
    index, parcel_anchor, required_parcel_anchor,
    handler_object;

  result = { required: [], remaining: [] };

  handler_object = Connect.url_handler_object;

  // Determine requested page or context signature
  //
  context_signature = null;

  if (handler_object['context'] !== undefined) {
    // Context/topic requested
    //
    context_and_topic = handler_object['context'];
    topic_index = context_and_topic.indexOf('/');
    context_signature = context_and_topic.substring(0, topic_index) + ':';
  }

  page_signature = null;

  if (handler_object['page'] !== undefined) {
    page_base_relative_url = handler_object['page'];

    // Ignore top-level files
    //
    if ((page_base_relative_url.indexOf('/') >= 0) || (page_base_relative_url.indexOf('%2f') >= 0) || (page_base_relative_url.indexOf('%2F') >= 0)) {
      // Build secure URI
      //
      page_base_relative_url = decodeURIComponent(page_base_relative_url);
      page_base_relative_url = page_base_relative_url.replace(/[\\<>:;"]|%5C|%3C|%3E|%3A|%3B|%22/gi, '');

      page_signature = page_base_relative_url.split('/')[0] + '.';
    }
  }

  // Check parcel anchors for a match against context or page signature
  //
  for (index = 0; index < Connect.parcel_anchors.length; index += 1) {
    parcel_anchor = Connect.parcel_anchors[index];

    // Required parcel?
    //
    required_parcel_anchor = false;
    if (index === 0) {
      // Always load first parcel
      //
      required_parcel_anchor = true;
    } else if ((context_signature !== null) && (parcel_anchor.id.indexOf(context_signature) === 0)) {
      // Captures exactly what we need
      //
      required_parcel_anchor = true;
    } else if ((page_signature !== null) && (parcel_anchor.href.indexOf(page_signature) > 0)) {
      // May capture more than we need
      //
      required_parcel_anchor = true;
    }

    // Assign parcel
    //
    if (required_parcel_anchor) {
      result.required.push(parcel_anchor);
    } else {
      result.remaining.push(parcel_anchor);
    }
  }

  return result;
};

Connect.CreateParcelGroupObjects = function () {
  'use strict';

  var parcel_group_objects, parcel_group_objects_final,
    parcel_requested_ids, parcels_requested_titles,
    parcel_li_elements;

  parcel_group_objects = [];
  parcel_group_objects_final = [];
  parcel_requested_ids = [];

  parcels_requested_titles = decodeURIComponent(Connect.url_handler_object['parcels']).split('/');
  parcel_li_elements = Connect.parcels_div.getElementsByTagName('li');

  for (var i = 0; i < parcel_li_elements.length; i++) {
    // Loop through all <li> elements, create an array of group object from them
    //
    // parcel_group_object = {
    //   'li_element': <element>, do we need?
    //   'id': <groupId>,
    //   'children': <array of groupIds (if applicable)>
    // }
    //
    var parcel_li, parcel_id, parcel_group_object;

    parcel_li = parcel_li_elements[i];
    parcel_id = parcel_li.id.replace('group:', '');

    parcel_group_object = {};
    parcel_group_object['li_element'] = parcel_li;
    parcel_group_object['id'] = parcel_id;

    if (parcel_id.split(':').length > 1) {
      parcel_group_object['children'] = parcel_id.split(':');
    }

    if (!Connect.ParcelGroupObjectsContainsId(parcel_group_objects, parcel_group_object['id'])) {
      parcel_group_objects.push(parcel_group_object);
    }
  }

  for (var i = 0; i < parcels_requested_titles.length; i++) {
    // Loop through the titles of requested parcels,
    // select <li> by it's 'data-group-title- attribute,
    // strip the groupId from it's 'id' attribute,
    // add the groupId to a list of requested groupIds
    //
    var requested_parcel_title, requested_parcel_li, requested_parcel_id;

    requested_parcel_title = parcels_requested_titles[i];
    requested_parcel_li = document.querySelector('li[data-group-title="' + requested_parcel_title + '"]');

    if (requested_parcel_li !== null) {
      requested_parcel_id = requested_parcel_li.id.replace('group:', '');
      parcel_requested_ids.push(requested_parcel_id);
    }
  }

  for (var i = 0; i < parcel_group_objects.length; i++) {
    // Loop through the array of group objects
    //
    var parcel_group_object;

    parcel_group_object = parcel_group_objects[i];

    for (var j = 0; j < parcel_requested_ids.length; j++) {
      // Loop through the requested parcel groupIds
      //
      var parcel_requested_id;

      parcel_requested_id = parcel_requested_ids[j];

      if (parcel_requested_id !== '') {
        if (parcel_group_object['children'] !== undefined &&
          parcel_group_object['children'].indexOf(parcel_requested_id) > -1) {
          // If the current group object has children,
          // and the current requested id is in the list of children,
          // create an empty list for selected children
          //
          var children;

          children = [];

          for (var k = 0; k < parcel_group_object['children'].length; k++) {
            // Loop through the group object's children
            // if the list of requested ids contains the current child,
            // add the id to the new list of children,
            // and clear the id from the requested list
            // (to prevent duplicates, and retain the parent/child relationship for later)
            //
            var child;

            child = parcel_group_object['children'][k];

            if (parcel_requested_ids.indexOf(child) > -1) {
              children.push(child);
              parcel_requested_ids[parcel_requested_ids.indexOf(child)] = '';
            }
          }

          // Replace the full list of children on the group object
          // with the new list that only contains requested children
          //
          parcel_group_object['children'] = children;

          if (parcel_group_objects_final.indexOf(parcel_group_object) === -1) {
            parcel_group_objects_final.push(parcel_group_object);
          }
        } else if (parcel_group_object['id'] === parcel_requested_id) {
          // If the requested id does not match a child of the group object,
          // but matches the id of the group object, it is a top-level group.
          // Add it if it is not already present.
          if (parcel_group_objects_final.indexOf(parcel_group_object) === -1) {
            parcel_group_objects_final.push(parcel_group_object);
          }
        }
      }
    }
  }

  return parcel_group_objects_final;
};

Connect.ParcelGroupObjectsContainsId = function (param_parcel_group_objects, param_id) {
  'use strict';

  var parcel_group_objects, parcel_group_object, array_contains_id;

  parcel_group_objects = param_parcel_group_objects;
  array_contains_id = false;

  for (var i = 0; i < parcel_group_objects.length; i++) {
    parcel_group_object = parcel_group_objects[i];

    if (parcel_group_object['id'] === param_id) {
      array_contains_id = true;
    }
  }

  return array_contains_id;
};

Connect.CreateParcelsHTML = function () {
  'use strict';

  var parcels_html, parcels_html_full;

  parcels_html = '';
  parcels_html_full = Connect.parcels_div.innerHTML;

  if (Connect.url_handler_object['parcels'] !== undefined) {
    var parcel_group_objects;

    parcel_group_objects = Connect.CreateParcelGroupObjects();

    if (parcel_group_objects.length > 0) {
      // Begin writing HTML
      //
      parcels_html += '<ul>';
      for (var i = 0; i < parcel_group_objects.length; i++) {
        // Loop through the group objects, and select the HTML from the master TOC
        // to create a subset
        var parcel_group_object, parcel_li_element;

        parcel_group_object = parcel_group_objects[i];
        parcel_li_element = parcel_group_object['li_element'];

        if (parcel_group_object['children'] !== undefined) {
          // Clear <ul> child from <li>
          // Create new <ul>
          // Select and append all <li> to the <ul> by child id
          // Append new <ul> to parent <li>
          var filtered_children_ul_element;

          filtered_children_ul_element = document.createElement('ul');

          for (var j = 0; j < parcel_group_object['children'].length; j++) {
            var child_id, child_li;

            child_id = parcel_group_object['children'][j];
            child_li = document.querySelector('li[id="group:' + child_id + '"]');

            if (child_li !== null) {
              filtered_children_ul_element.appendChild(child_li);
            }
          }

          for (var j = 0; j < parcel_li_element.children.length; j++) {
            // Find the ul element and replace it.
            if (parcel_li_element.children[j].nodeName === 'UL') {
              var children_ul_element;

              children_ul_element = parcel_li_element.children[j];

              parcel_li_element.removeChild(children_ul_element);
              parcel_li_element.appendChild(filtered_children_ul_element);
            }
          }

          parcel_li_element.outerHTML.toString();
        }

        parcels_html += parcel_li_element.outerHTML.toString();
      }
      parcels_html += '</ul>';
    }
    else {
      parcels_html = parcels_html_full;
    }
  }
  else {
    parcels_html = parcels_html_full;
  }

  return parcels_html;
}

Connect.Parcels_PrepareForLoad = function () {
  'use strict';

  var parcel_anchors, parcel_anchor, parcel_context_and_id, parcel_context, parcel_id;

  Connect.parcel_anchors = [];
  Connect.parcel_ids = [];
  Connect.parcel_context_ids = {};
  Connect.parcel_prefixes = {};
  Connect.parcel_prefixes[Connect.base_url + 'connect/'] = true;

  Connect.parcels_div.innerHTML = Connect.parcels_initial_html;
  Connect.toc_content_div.innerHTML = Connect.CreateParcelsHTML();

  parcel_anchors = Connect.toc_div.getElementsByTagName('a');
  Connect.parcels_div.style.display = 'none';

  if (parcel_anchors.length === 0) {
    parcel_anchors = Connect_Window.document.links;
  }

  for (var index = 0; index < parcel_anchors.length; index += 1) {
    parcel_anchor = parcel_anchors[index];
    Connect.parcel_anchors[Connect.parcel_anchors.length] = parcel_anchor;

    // Add to collection of valid parcels
    //
    parcel_context_and_id = parcel_anchor.id.split(':');
    if (parcel_context_and_id[0] !== '') {
      parcel_context = parcel_context_and_id[0];
      parcel_id = parcel_context_and_id[1];
      Connect.AddParcel(parcel_context, parcel_id, parcel_anchor.href, parcel_anchor.innerHTML);
      Connect.parcel_ids[Connect.parcel_ids.length] = parcel_id;

      // Add to search scopes
      //
      if (Connect.scope_enabled) {
        Scope.AddSearchScope(parcel_anchor, parcel_id, parcel_context, index);
      }
    }
  }

  if (Connect.scope_enabled) {
    Scope.search_scope_selections = ['all'];
    Scope.RenderScopeSelector(Connect_Window.document, Scope.search_scopes);
    Scope.WriteSelectionsString();
  }
};

Connect.Parcels_Load = function () {
  'use strict';

  var required_and_remaining_parcel_anchors, ajaxdata;

  // Reset progress
  //
  Connect.progress.Reset();
  Connect.progress.Show();

  // Configure parcel TOC levels
  //
  Connect.ConfigureTOCLevels(Connect.toc_div, 0);

  // Determine required and remaining parcels
  //
  required_and_remaining_parcel_anchors = Connect.Parcels_DetermineRequiredAndRemaining();

  // Load required parcels
  //
  ajaxdata = new AJAXData_Object(
    required_and_remaining_parcel_anchors.required,
    function (param_entry) {
      return param_entry.href;
    },
    function (param_percent) {
      Connect.progress.Update(param_percent);
    },
    Connect.Parcels_AddData,
    function () {
      var buttons_to_remove, button_to_remove, ie_match;

      // Parcels loaded!
      //
      Connect.parcels_loaded_initial = true;

      // Intercept toolbar links
      //
      buttons_to_remove = [];
      Browser.ApplyToElementsWithQuerySelector(
        'body a[class*=ww_behavior]',
        function (param_link) {
          var match, button_key, button_span, keep;

          param_link.onclick = Connect.ToolbarLink;

          // Track buttons
          //
          match = param_link.className.match(Connect.button_behavior_expression);
          if (match !== null) {
            button_key = match[0];
            button_span = Browser.FindParentWithTagName(param_link, 'span');
            if (button_span !== null) {
              // Keep button?
              //
              keep = true;
              if (Connect_Window.document.location.protocol === 'file:') {
                if (button_key === 'ww_behavior_globe') {
                  keep = false;
                }
              }

              // Process button
              //
              if (keep) {
                Connect.buttons[button_key] = button_span;

                // Initialize sidebar behavior
                //
                if ((Connect.sidebar_behavior === undefined) && ((button_key === 'ww_behavior_toc') ||
                  (button_key === 'ww_behavior_index'))) {
                  Connect.sidebar_behavior = button_key;
                }
              } else {
                buttons_to_remove[buttons_to_remove.length] = button_span;
              }
            }
          }
        }
      );

      // Remove buttons
      //
      while (buttons_to_remove.length > 0) {
        button_to_remove = buttons_to_remove.shift();
        if ((button_to_remove.parentNode !== undefined) && (button_to_remove.parentNode !== null)) {
          button_to_remove.parentNode.removeChild(button_to_remove);
        }
      }

      // Handle toolbar search
      //
      ie_match = Connect_Window.navigator.userAgent.match(/MSIE (\d+)\.\d+;/);
      if ((ie_match === null) || ((ie_match.length > 1) && (parseInt(ie_match[1], 10) > 7))) {
        // Use toolbar search form
        //
        Browser.ApplyToChildElementsWithTagName(
          Connect.toolbar_div,
          'form',
          function (param_form) {
            if (Browser.ContainsClass(param_form.className, 'ww_skin_search_form')) {
              param_form.onsubmit = function () {
                if (Connect.SearchEnabled()) {
                  Connect.HandleSearch();
                }
                else {
                  Connect.Button_Search();
                }

                return false;
              };
            }
          }
        );
        Browser.ApplyToChildElementsWithTagName(
          Connect.toolbar_div,
          'input',
          function (param_input) {
            if (Browser.ContainsClass(param_input.className, 'ww_skin_search_input')) {
              Connect.search_input = param_input;
            }
          }
        );
      } else {
        // Eliminate toolbar search form for IE
        //
        Browser.ApplyToChildElementsWithTagName(
          Connect.toolbar_div,
          'form',
          function (param_form) {
            var parent_element, button_span;

            // Promote button to form peer
            //
            parent_element = param_form.parentNode;
            button_span = Connect.buttons['ww_behavior_search'];
            if (button_span !== undefined) {
              parent_element.insertBefore(button_span, param_form);
            }

            // Remove search form
            //
            parent_element.removeChild(param_form);
          }
        );
        Browser.ApplyToChildElementsWithTagName(
          Connect.toolbar_div,
          'input',
          function (param_input) {
            var parent_element;

            parent_element = param_input.parentNode;
            parent_element.removeChild(param_input);
          }
        );
      }

      // Display specified document
      //
      if (Connect_Window.location.hash.length > 0) {
        // Use hash
        //
        Connect.DisplaySpecifiedDocument();
      } else {
        // Process default page load
        //
        Connect.DisplayPage(Connect.default_page_url, false);
      }

      // Check for hash changes
      //
      if (('onhashchange' in Connect_Window) && (typeof Connect_Window.history.pushState === 'function')) {
        // Events are so nice!
        //
        Connect_Window.onhashchange = Connect.HashChanged;
      } else {
        // Poll
        //
        Connect.poll_onhashchange = function () {
          Connect.HashChanged();

          Connect_Window.setTimeout(Connect.poll_onhashchange, 100);
        };
        Connect_Window.setTimeout(Connect.poll_onhashchange, 1);
      }

      // Done!
      //
      Connect.progress.Complete();

      // Show
      //
      Connect.presentation_div.style.visibility = 'visible';

      // Load remaining parcels
      //
      if (required_and_remaining_parcel_anchors.remaining.length > 0) {
        Connect.parcels_remaining = required_and_remaining_parcel_anchors.remaining;
      } else {
        // All parcels loaded
        //
        Connect.parcels_loaded_all = true;
      }
    }
  );

  ajaxdata.Execute();
};

Connect.Parcels_LoadRemaining = function (param_remaining_parcel_anchors) {
  'use strict';

  var ajaxdata;

  ajaxdata = new AJAXData_Object(
    param_remaining_parcel_anchors,
    function (param_entry) {
      return param_entry.href;
    },
    function (param_percent) {
    },
    Connect.Parcels_AddData,
    function () {
      // All parcels loaded
      //
      Connect.parcels_loaded_all = true;
    }
  );

  ajaxdata.Execute();
};

Connect.CreateHandlerObject = function () {
  'use strict';

  var url_hash, url_queries, handler_object;

  url_hash = Connect_Window.location.hash;
  handler_object = Connect.url_handler_object;

  if (!handler_object) {
    handler_object = {};
  }

  url_queries = url_hash.split('#');

  for (var i = 0; i < url_queries.length; i++) {
    if (url_queries[i] !== '') {
      var url_query, handler_action, handler_arguments, handler_argument;

      url_query = url_queries[i].split('/');
      handler_action = url_query[0];
      url_query.shift();
      handler_arguments = url_query;
      handler_argument = handler_arguments.join('/')

      // Can only have one of 'context', 'page' and 'search' at a time
      //
      switch (handler_action) {
        case 'context':
          handler_object[handler_action] = handler_argument;
          delete handler_object['page'];
          delete handler_object['search'];
          delete handler_object['scope'];
          break;
        case 'page':
          handler_object[handler_action] = handler_argument;
          delete handler_object['context'];
          delete handler_object['search'];
          delete handler_object['scope'];
          break;
        case 'search':
          handler_object[handler_action] = handler_argument;
          delete handler_object['context'];
          delete handler_object['page'];
          break;
        default:
          handler_object[handler_action] = handler_argument;
          break;
      }
    }
  }

  return handler_object;
};

Connect.CreateHashFromHandlerObject = function () {
  'use strict';

  var handler_object, final_hash;

  handler_object = Connect.url_handler_object;
  final_hash = '';

  for (var prop in handler_object) {
    var prop_hash;

    prop_hash = '#' + prop + '/' + handler_object[prop];

    final_hash += prop_hash;
  }

  return final_hash;
};

Connect.DisplaySpecifiedDocument = function () {
  'use strict';

  var specified_document_url,
    context_and_topic, context, topic, parcel_id, topic_id, topic_anchor,
    search_words_parameter, search_words, search_scope,
    page_base_relative_url, page_url,
    handler_object, current_parcel_hash, parcel_hash_changed;

  // Initialize hash tracking
  //
  Connect.hash = Connect_Window.location.hash;

  // Start page load
  //
  specified_document_url = Connect.default_page_url;
  if ((Connect_Window.location.hash === '') || (Connect_Window.location.hash === '#')) {
    // Show default page
    //
    specified_document_url = Connect.default_page_url;
  }
  else {
    current_parcel_hash = Connect.url_handler_object['parcels'];

    // Create handler object
    //
    Connect.url_handler_object = Connect.CreateHandlerObject();
    handler_object = Connect.url_handler_object;

    parcel_hash_changed = current_parcel_hash !== Connect.url_handler_object['parcels'] ? true : false;

    if (handler_object['context'] !== undefined) {
      // #context/
      // Context/topic requested
      //

      context_and_topic = handler_object['context'].split('/');
      if (context_and_topic.length == 1) {

        topic = context_and_topic[0];

        // Resolve context by selecting by ID iteratively
        //
        if (topic.length > 0) {

          var context_ids = Connect.parcel_context_ids;

          for (var context in context_ids) {
            var context_id = context_ids[context];

            if (context_id !== undefined) {
              topic_id = 'topic:' + context_id + ':' + topic;
              topic_anchor = Connect_Window.document.getElementById(topic_id);
              if (topic_anchor !== null) {
                // Found topic!
                //
                specified_document_url = topic_anchor.href;

                if (Connect.google_analytics_enabled) {
                  Analytics.event_type = 'topic_lookup';
                  Analytics.event_data = {
                    context: context,
                    topic_alias: topic
                  };
                  Analytics.CaptureEvent();
                }

                break;
              }
            }
          }
        }
      } else if (context_and_topic.length == 2) {

        context = context_and_topic[0];
        topic = context_and_topic[1];

        // Resolve context by selecting ID using topic and context
        //
        if ((context.length > 0) && (topic.length > 0) && (typeof Connect.parcel_context_ids[context] === 'string')) {
          parcel_id = Connect.parcel_context_ids[context];
          topic_id = 'topic:' + parcel_id + ':' + topic;
          topic_anchor = Connect_Window.document.getElementById(topic_id);
          if (topic_anchor !== null) {
            // Found topic!
            //
            specified_document_url = topic_anchor.href;

            if (Connect.google_analytics_enabled) {
              Analytics.event_type = 'topic_lookup';
              Analytics.event_data = {
                context: context,
                topic_alias: topic
              };
              Analytics.CaptureEvent();
            }
          }
        }
      }
    } else if (handler_object['search'] !== undefined) {
      // #search/
      // Search enabled?
      //
      if (Connect.search_div !== null) {
        // Search requested
        //
        var search_parameters, search_scope_parameter, search_scope_selections;

        search_words_parameter = search_scope_parameter = '';

        search_words_parameter = handler_object['search'];
        search_words = decodeURIComponent(search_words_parameter);

        if (Connect.scope_enabled) {
          search_scope = ['all'];

          if (handler_object['scope'] !== undefined) {
            // #scope/
            // Load search scope selections
            //

            search_scope = [];
            search_scope_selections = handler_object['scope'].split('/');

            // Loop through selections
            //
            for (var i = 0; i < search_scope_selections.length; i++) {
              var scope_selection, scope_title;

              scope_selection = search_scope_selections[i];
              scope_title = decodeURIComponent(scope_selection);

              // Attempt to match selection to the title of a
              // scope in Connect
              //
              for (var property in Scope.search_scopes) {
                if (Scope.search_scopes.hasOwnProperty(property)) {
                  var connect_scope_title;

                  connect_scope_title = Scope.search_scopes[property].title;

                  if (connect_scope_title === scope_title) {
                    search_scope.push(String(property));
                  }
                }
              }
            }
            // Fallback to 'all'
            //
            if (search_scope.length === 0) {
              search_scope = ['all'];
            }
          }

          Scope.search_scope_selections = search_scope;
          Scope.WriteSelectionsString();
          Scope.CheckCurrentSelectionCheckboxes();
        }

        // Show search page
        //
        if (!Connect.SearchEnabled()) {
          Connect.ShowSearchPage();
          Connect.AdjustLayoutForBrowserSize();
        }

        // Initiate search
        //
        Connect.search_query = search_words;
        Connect.search_input.value = search_words;
        Connect.HandleSearch();
      }
    } else if (handler_object['page'] !== undefined) {
      // #page/
      // Page requested
      //
      page_base_relative_url = handler_object['page'];

      // Ignore top-level files
      //
      if ((page_base_relative_url.indexOf('/') >= 0) || (page_base_relative_url.indexOf('%2f') >= 0) || (page_base_relative_url.indexOf('%2F') >= 0)) {
        // Build secure URI
        //
        page_base_relative_url = decodeURIComponent(page_base_relative_url);
        page_base_relative_url = page_base_relative_url.replace(/[\\<>:;"]|%5C|%3C|%3E|%3A|%3B|%22/gi, '');

        page_url = Connect.base_url + page_base_relative_url;
        specified_document_url = page_url;
      }

      // Hide search page
      if (Connect.SearchEnabled()) {
        Connect.HideSearchPage();
      }
    }

    if (handler_object['toc'] !== undefined) {
      // #toc/
      // TOC enabled?
      //
      if (Connect.toc_div !== null) {
        // Display TOC
        //
        if (Connect.sidebar_behavior !== 'ww_behavior_toc') {
          Connect.sidebar_behavior = 'ww_behavior_toc';
          Connect.Button_TOC();
        }
      }
    } else if (handler_object['index'] !== undefined) {
      // #index/
      // Index enabled?
      //
      if (Connect.index_div !== null) {
        // Display index
        //
        if (Connect.sidebar_behavior !== 'ww_behavior_index') {
          Connect.sidebar_behavior = 'ww_behavior_index';
          Connect.Button_Index();
        }
      }
    }

    if (handler_object['parcels'] !== undefined) {
      // Reload parcels
      //
      if (parcel_hash_changed) {
        // Reload Page to set new Parcels
        //
        Connect_Window.location.reload();
      }
    }
  }

  // Display specified document
  //
  if (specified_document_url !== undefined && !Connect.SearchEnabled()) {
    Connect.DisplayPage(specified_document_url, false);
  }
};

Connect.HashChanged = function () {
  'use strict';

  if (Connect_Window.location.hash !== Connect.hash) {
    // Update document
    //
    Connect.DisplaySpecifiedDocument();
  }
};

Connect.LocateTOCEntry = function () {
  'use strict';

  var result, page_id, possible_toc_entry_id, possible_toc_link, toc_page_element;

  result = null;

  // See if page exists in TOC
  //
  if (Connect.page_info !== undefined) {
    page_id = Connect.page_info.id;

    // Page ID defined?
    //
    if ((typeof page_id === 'string') && (page_id.length > 0)) {
      // Try instant lookup with document hash
      //
      if ((Connect.page_info.hash.length > 1) && (Connect.page_info.hash.charAt(0) === '#')) {
        possible_toc_entry_id = page_id + ':' + Connect.page_info.hash.substring(1);
        possible_toc_link = Connect_Window.document.getElementById(possible_toc_entry_id);
        if (possible_toc_link !== null) {
          // TOC link located!
          //
          result = Browser.FindParentWithTagName(possible_toc_link, 'li');
        }
      }

      // Result found?
      //
      if (result === null) {
        // Check for page ID in TOC
        //
        toc_page_element = Connect_Window.document.getElementById(page_id);
        if (toc_page_element !== null) {
          // Found page!
          //
          result = Browser.FindParentWithTagName(toc_page_element, 'li');
        }
      }
    }
  }

  return result;
};

Connect.DetermineTOCLevel = function (param_container_element, param_ul) {
  'use strict';

  var level, current_node;

  // Determine initial level
  //
  level = 0;
  if (param_ul !== param_container_element) {
    level = 1;
  }

  // Determine level
  //
  current_node = param_ul.parentNode;
  while (current_node !== param_container_element) {
    if (current_node.nodeName.toLowerCase() === 'ul') {
      level += 1;
    }

    current_node = current_node.parentNode;
  }

  return level;
};

Connect.ConfigureTOCLevels = function (param_container_element, param_level_offset) {
  'use strict';

  var toc_layout_div;

  // Configure TOC levels
  //
  Browser.ApplyToChildElementsWithTagName(
    param_container_element,
    'ul',
    function (param_ul) {
      var level, class_name;

      // Determine level
      //
      level = param_level_offset + Connect.DetermineTOCLevel(param_container_element, param_ul);

      // Initialize open/close
      //
      class_name = 'ww_skin_toc_level ww_skin_toc_level_' + level;
      if ((level === 1) || (Browser.ContainsClass(param_ul.className, 'ww_skin_toc_container_open'))) {
        class_name += ' ww_skin_toc_container_open';
      } else {
        class_name += ' ww_skin_toc_container_closed';
      }

      // Update class name
      //
      param_ul.className = class_name;
    });

  // Initialize open or closed based on entry state
  //
  toc_layout_div = Browser.FirstChildElementWithTagName(param_container_element, 'div');
  if (toc_layout_div !== null) {
    if (Connect.TOCFolder_IsOpen(toc_layout_div)) {
      Connect.TOCFolder_Open(toc_layout_div);
    } else {
      Connect.TOCFolder_Close(toc_layout_div);
    }
  }

  // Track folder clicks
  //
  Browser.ApplyToChildElementsWithTagName(
    param_container_element,
    'div',
    function (param_div) {
      if (Browser.ContainsClass(param_div.className, 'ww_skin_toc_entry')) {
        param_div.onclick = Connect.TOCEntryClickHandler;

        Browser.ApplyToChildElementsWithTagName(
          param_div,
          'span',
          function (param_span) {
            if (Browser.ContainsClass(param_span.className, 'ww_skin_toc_dropdown')) {
              param_span.onclick = Connect.TOCDropdownClickHandler;
            }
          });
      }
    });
};

Connect.UpdateBackToTop = function (param_top) {
  'use strict';

  if (Connect.back_to_top_element !== null) {
    if (param_top > 80) {
      Connect.back_to_top_element.className = Browser.AddClass(Connect.back_to_top_element.className, 'back_to_top_show');
    } else {
      Connect.back_to_top_element.className = Browser.RemoveClass(Connect.back_to_top_element.className, 'back_to_top_show');
    }
  }
};

Connect.HandleScrollForBackToTop = function () {
  'use strict';
  var scroll_position;

  if (Connect.page_first_scroll &&
    Connect.google_analytics_enabled) {
    Connect.page_first_scroll = false;
    Analytics.event_type = 'page_first_scroll';
    Analytics.CaptureEvent();
  }

  scroll_position = parseFloat(Connect.container_div.scrollTop);
  Connect.UpdateBackToTop(scroll_position);
};

Connect.BackToTop = function () {
  'use strict';

  var data;

  // Scroll page to desired position
  //
  Connect.ScrollTo(0, 0);

  // Request page to scroll to the desired position
  //
  data = {
    'action': 'back_to_top'
  };
  Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
};

Connect.BackToTopLink = function (param_event) {
  'use strict';

  var event, result;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }

  // Back to top
  //
  Connect.BackToTop();

  // Prevent default link behavior
  //
  result = false;

  return result;
};

Connect.ToolbarLink = function (param_event) {
  'use strict';

  var event, result;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }

  if (Connect.scope_enabled) {
    Scope.CloseDropDown();
  }

  if (Connect.google_analytics_enabled) {
    Analytics.event_type = 'toolbar_button_click';
    Analytics.CaptureEvent();
  }

  // Process event
  //
  result = Connect.HandleToolbarLink(this);

  return result;
};

Connect.TOCFindFirstValidLinkElement = function (param_li_element) {
  'use strict';

  var valid_link_element, div_element, link_element, ul_element, li_element;

  // Initialize return value
  //
  valid_link_element = null;

  // Check existing entry
  //
  div_element = Browser.FirstChildElementWithTagName(param_li_element, 'div');
  if (div_element !== null) {
    link_element = Browser.FirstChildElementWithTagName(div_element, 'a');
    if ((link_element !== null) && (link_element.href !== '')) {
      valid_link_element = link_element;
    }
  }

  // Anything found?
  //
  if (valid_link_element === null) {
    // Check nested list
    //
    ul_element = Browser.FirstChildElementWithTagName(param_li_element, 'ul');
    if (ul_element !== null) {
      li_element = Browser.FirstChildElementWithTagName(ul_element, 'li');
      if (li_element !== null) {
        valid_link_element = Connect.TOCFindFirstValidLinkElement(li_element);
      }

      // Try next entry?
      //
      if (valid_link_element === null) {
        li_element = Browser.NextSiblingElementWithTagName(li_element, 'li');
        while ((valid_link_element === null) && (li_element !== null)) {
          valid_link_element = Connect.TOCFindFirstValidLinkElement(li_element);
          li_element = Browser.NextSiblingElementWithTagName(li_element, 'li');
        }
      }
    }
  }

  return valid_link_element;
};

Connect.TOCLinkProcessor = function (param_link) {
  'use strict';

  var result;

  result = true;

  // Process link
  //
  if ((param_link !== null) && (param_link.href !== '')) {
    if ((param_link.className.length === 0) &&
      (Browser.ContainsClass(param_link.parentNode.className, 'ww_skin_toc_folder'))) {
      // Unloaded parcel TOC link
      //
      result = false;
    } else {
      result = Connect.HandleInterceptLink(param_link, true);
      if (result === false) {
        // Clean up folders?
        //
        if (Connect.layout_wide) {
          // Keep the menu active!
          //
          Connect.toc_cleanup_folders = false;
        }
      }
    }
  }

  return result;
};

Connect.TOCEntryClickHandler = function (param_event) {
  'use strict';

  var result, event, child_link, toc_li_element;

  result = true;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }

  // Clicked folder?
  //
  child_link = null;
  if (Browser.ContainsClass(this.className, 'ww_skin_toc_folder')) {
    // Toggle open/closed
    //
    Connect.TOCFolder_Toggle(this);

    // Opened folder?
    //
    if (Connect.TOCFolder_IsOpen(this)) {
      // Locate valid child link?
      //
      toc_li_element = Browser.FindParentWithTagName(this, 'li');
      if (toc_li_element !== null) {
        child_link = Connect.TOCFindFirstValidLinkElement(toc_li_element);
      }
    }

    result = false;
  } else {
    // Access child link
    //
    child_link = Browser.FirstChildElementWithTagName(this, 'a');
  }

  if (Connect.google_analytics_enabled) {
    Analytics.event_type = 'menu_click_toc';
    Analytics.CaptureEvent();
  }

  // Process child link
  //
  result = Connect.TOCLinkProcessor(child_link);

  return result;
};

Connect.TOCDropdownClickHandler = function (param_event) {
  'use strict';

  var result, event, parent_div;

  result = true;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }

  // Clicked folder?
  //
  parent_div = Browser.FindParentWithTagName(this, 'div');
  if ((parent_div !== null) && (Browser.ContainsClass(parent_div.className, 'ww_skin_toc_folder'))) {
    // Toggle open/closed
    //
    Connect.TOCFolder_Toggle(parent_div);

    result = false;
  }

  return result;
};

Connect.TOCLinkClickHandler = function (param_event) {
  'use strict';

  var event, parent_div, result;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }

  // Expand if closed folder
  //
  parent_div = Browser.FindParentWithTagName(this, 'div');
  if ((parent_div !== null) && (Browser.ContainsClass(parent_div.className, 'ww_skin_toc_folder'))) {
    Connect.TOCFolder_Open(parent_div);
  }

  if (Connect.google_analytics_enabled) {
    Analytics.event_type = 'menu_click_toc';
    Analytics.CaptureEvent();
  }

  // Process event
  //
  result = Connect.TOCLinkProcessor(this);

  return result;
};

Connect.IndexLink = function (param_event) {
  'use strict';

  var result, event, hash_index, see_also_id, index_entry;

  result = false;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }

  if (Connect.google_analytics_enabled) {
    Analytics.event_type = 'menu_click_index';
    Analytics.CaptureEvent();
  }

  // See/See Also link?
  //
  if (this.rel.toLowerCase() === 'see') {
    hash_index = this.href.indexOf('#');
    if (hash_index >= 0) {
      see_also_id = this.href.substring(hash_index + 1);

      index_entry = Connect_Window.document.getElementById(see_also_id);
      if (index_entry !== null) {
        // Scroll to Index position
        //
        Connect.ScrollToPanelElement(index_entry);
      }
    }

    result = false;
  } else {
    // Document link
    //
    result = Connect.HandleInterceptLink(this, true);
  }

  return result;
};

Connect.TOC_ElementKey = function (param_element) {
  'use strict';

  var element_key, element_in_path, position, sibling;

  // Build key
  //
  element_key = '';
  element_in_path = param_element;
  while ((element_in_path !== undefined) && (element_in_path !== null) && ((typeof element_in_path.id !== 'string') || (element_in_path.id.length === 0))) {
    position = 0;
    sibling = element_in_path;
    while (sibling !== null) {
      position += 1;
      sibling = sibling.previousSibling;
    }
    element_key = element_in_path.nodeName + ':' + position + ':' + element_key;
    element_in_path = element_in_path.parentNode;
  }
  if ((element_in_path !== undefined) && (element_in_path !== null)) {
    element_key = element_in_path.id + ':' + element_key;
  }

  return element_key;
};

Connect.TOC_RecordClassState = function (param_element) {
  'use strict';

  var element_key;

  // Track original class info if enabled
  //
  if (Connect.toc_class_states !== null) {
    // Build key
    //
    element_key = Connect.TOC_ElementKey(param_element);

    // Already tracking?
    //
    if (typeof Connect.toc_class_states[element_key] !== 'object') {
      Connect.toc_class_states[element_key] = { 'element': param_element, 'className': param_element.className };
    }
  }
};

Connect.TOC_RestoreClassStates = function (param_folder_exceptions) {
  'use strict';

  var element_key, preserved_toc_class_states, entry_state;

  if (Connect.toc_class_states !== null) {
    preserved_toc_class_states = {};
    for (element_key in Connect.toc_class_states) {
      if (typeof Connect.toc_class_states[element_key] === 'object') {
        entry_state = Connect.toc_class_states[element_key];
        entry_state.element.className = entry_state.className;

        // Keep folder open?
        //
        if (Browser.ContainsClass(entry_state.className, 'ww_skin_toc_folder')) {
          if ((param_folder_exceptions !== undefined) && (typeof param_folder_exceptions[element_key] === 'boolean')) {
            // Keep folder open
            //
            preserved_toc_class_states[element_key] = entry_state;
          } else {
            // Collapse folder
            //
            Connect.TOCFolder_Close(entry_state.element);
          }
        }
      }
    }

    // Reset tracked states
    //
    Connect.toc_class_states = preserved_toc_class_states;
  }
};

Connect.TOCFolder_IsOpen = function (param_entry_div) {
  'use strict';

  var result, child_span;

  // Initialize return value
  //
  result = false;

  if (Browser.ContainsClass(param_entry_div.className, 'ww_skin_toc_folder')) {
    child_span = Browser.FirstChildElementWithTagName(param_entry_div, 'span');
    if (child_span !== null) {
      result = Browser.ContainsClass(child_span.className, 'ww_skin_toc_dropdown_open');
    }
  }

  return result;
};

Connect.TOCFolder_Open = function (param_entry_div) {
  'use strict';

  var child_span, sibling_ul;

  if (Browser.ContainsClass(param_entry_div.className, 'ww_skin_toc_folder')) {
    Connect.TOC_RecordClassState(param_entry_div);

    child_span = Browser.FirstChildElementWithTagName(param_entry_div, 'span');
    if (child_span !== null) {
      child_span.className = Browser.ReplaceClass(child_span.className, 'ww_skin_toc_dropdown_closed', 'ww_skin_toc_dropdown_open');
    }
    sibling_ul = Browser.NextSiblingElementWithTagName(param_entry_div, 'ul');
    if (sibling_ul !== null) {
      sibling_ul.className = Browser.ReplaceClass(sibling_ul.className, 'ww_skin_toc_container_closed', 'ww_skin_toc_container_open');
    }
  }
};

Connect.TOCFolder_Close = function (param_entry_div) {
  'use strict';

  var child_span, sibling_ul;

  if (Browser.ContainsClass(param_entry_div.className, 'ww_skin_toc_folder')) {
    Connect.TOC_RecordClassState(param_entry_div);

    child_span = Browser.FirstChildElementWithTagName(param_entry_div, 'span');
    if (child_span !== null) {
      child_span.className = Browser.ReplaceClass(child_span.className, 'ww_skin_toc_dropdown_open', 'ww_skin_toc_dropdown_closed');
    }
    sibling_ul = Browser.NextSiblingElementWithTagName(param_entry_div, 'ul');
    if (sibling_ul !== null) {
      sibling_ul.className = Browser.ReplaceClass(sibling_ul.className, 'ww_skin_toc_container_open', 'ww_skin_toc_container_closed');
    }
  }
};

Connect.TOCFolder_Toggle = function (param_entry_div) {
  'use strict';

  if (Browser.ContainsClass(param_entry_div.className, 'ww_skin_toc_folder')) {
    if (Connect.TOCFolder_IsOpen(param_entry_div)) {
      Connect.TOCFolder_Close(param_entry_div);
    } else {
      Connect.TOCFolder_Open(param_entry_div);
    }
    Connect.Menu.CalculateMenuSize();
  }
};

Connect.DisplayPage = function (param_href, param_hide_menu) {
  'use strict';

  // If search is enabled, disable it and continue
  //
  if (Connect.SearchEnabled()) {
    delete Connect.url_handler_object['search'];
    delete Connect.url_handler_object['scope'];
    Connect.HideSearchPage();
  }

  // Disable home button?
  //
  if (Browser.SameDocument(Connect.splash_page_url, param_href)) {
    Connect.EnableDisableButton('ww_behavior_home', 'ww_skin_home', false);
  } else {
    Connect.EnableDisableButton('ww_behavior_home', 'ww_skin_home', true);
  }

  // Hide menu
  //
  if (param_hide_menu) {
    if (Connect.Menu.Enabled && Connect.Menu.Visible() && (!Connect.layout_wide)) {
      Connect.Menu.Hide();
    }
  }

  Connect_Window.setTimeout(function () {
    var target_href, desired_hash, same_document, data, guessed_height;

    // Ensure target href is valid
    //
    target_href = param_href;
    if ((target_href === undefined) || (target_href === null) || (target_href.length === 0)) {
      target_href = Connect.splash_page_url;
    }

    if (Connect.page_info !== undefined) {
      // Determine desired hash
      //
      desired_hash = '';
      if (target_href.indexOf('#') !== -1) {
        desired_hash = target_href.substring(target_href.indexOf('#'));
      }

      // Load new document or update hash
      //
      same_document = Browser.SameDocument(Connect.page_info.href, target_href);
      if (same_document) {
        // Update hash
        //

        data = {
          'action': 'update_hash',
          'hash': desired_hash
        };
        Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);

        // Clear target_href
        //
        target_href = undefined;
      }
    }

    // Display target href if not already handled
    //
    if (target_href !== undefined) {
      // Reset back to top
      //
      if (Connect.back_to_top_element !== null) {
        Connect.back_to_top_element.className = Browser.RemoveClass(Connect.back_to_top_element.className, 'back_to_top_show');
      }

      // Display document as page
      //
      if (('onhashchange' in Connect_Window) && (typeof Connect_Window.history.pushState === 'function')) {
        Connect.page_iframe.contentWindow.location.replace(target_href);
      } else {
        Connect.page_iframe.contentWindow.location.assign(target_href);
      }
    }
  }, 1);
};

Connect.InterceptLink = function (param_event) {
  'use strict';

  var result;

  result = Connect.HandleInterceptLink(this, false);

  return result;
};

Connect.HandleToolbarLink = function (param_link) {
  'use strict';

  var result, behavior;

  result = true;

  if (typeof param_link.className === 'string') {
    // Determine handlers for button
    //
    for (behavior in Connect.button_behaviors) {
      if (typeof Connect.button_behaviors[behavior] === 'function') {
        if (Browser.ContainsClass(param_link.className, behavior)) {
          Connect.button_behaviors[behavior](param_link);
          result = false;
          break;
        }
      }
    }
  }

  return result;
};

Connect.HandleInterceptLink = function (param_link, param_hide_menu) {
  'use strict';

  var result;

  result = Connect.HandleToolbarLink(param_link);
  if (result === true) {
    // Standard link
    //
    if ((param_link.href !== undefined) && (param_link.href !== null) && (param_link.href !== '')) {
      if ((param_link.target === undefined) || (param_link.target === null) || (param_link.target === '') || (param_link.target === 'connect_page')) {
        // Use existing page iframe
        //
        Connect.DisplayPage(param_link.href, param_hide_menu);
      } else {
        // Display in requested window
        //
        Connect_Window.open(param_link.href, param_link.target);
      }

      // Prevent default link behavior
      //
      result = false;
    }
  }

  return result;
};

Connect.DocumentBookkeeping = function (param_same_document) {
  'use strict';

  var cleanup_folders, relative_path, page_hash, page_href, data, behavior;

  // Handle TOC sync
  //
  cleanup_folders = Connect.toc_cleanup_folders;
  Connect.toc_cleanup_folders = true;

  // Determine relative path
  //
  if (Connect.page_info !== undefined) {
    // Update hash
    //
    if (Browser.SameHierarchy(Connect.base_url, Connect.page_info.href)) {
      relative_path = Browser.RelativePath(Connect.base_url, Connect.page_info.href);
      Connect.url_handler_object['page'] = encodeURIComponent(relative_path);
      page_hash = '#page/' + Connect.url_handler_object['page'];

      // Splash page?
      //
      if (Browser.SameDocument(Connect.default_page_url, Connect.page_info.href)) {
        if ((Connect_Window.location.hash === page_hash) || (Connect_Window.location.hash === decodeURIComponent(page_hash)) || (Connect_Window.location.hash === '')) {
          // No change!
          //
          page_hash = Connect_Window.location.hash;
        }
      }

      if ((Connect_Window.location.hash !== page_hash) && (Connect_Window.location.hash !== decodeURIComponent(page_hash))) {
        // Determine updated href with new hash
        //
        page_href = Connect_Window.location.href;
        if (Connect_Window.location.hash.length > 0) {
          page_href = page_href.substring(0, page_href.lastIndexOf(Connect_Window.location.hash));
        }

        // page_href += page_hash;
        page_href += Connect.CreateHashFromHandlerObject();

        // Update hash
        //
        if (('onhashchange' in Connect_Window) && (typeof Connect_Window.history.pushState === 'function')) {
          try {
            // Trap Chrome pushState() exception on 'file://' URLs
            //
            Connect_Window.history.pushState({}, '', page_href);
          } catch (e) {
            // Ignore
            //
            Connect_Window.location.assign(page_href);
          }
        } else {
          Connect_Window.location.replace(page_href);
        }
      }
    }

    // Track current hash
    //
    Connect.hash = Connect_Window.location.hash;
    Connect.url_handler_object = Connect.CreateHandlerObject();

    // Scroll to top if necessary
    //
    if (Connect.page_info.hash === '') {
      Connect.ScrollTo(0, 0);
    }

    // Sync TOC
    //
    Connect.SyncTOC(cleanup_folders);

    // Report to Analytics if enabled
    //
    if (Connect.google_analytics_enabled) {
      var event_type, event_data,
        page_title, page_location, page_hash, page_path,
        search_query;

      event_type = '';
      event_data = {};

      page_title = Connect.page_info.title;
      page_location = Connect.page_info.href;
      page_hash = decodeURIComponent('#page/' + Connect.url_handler_object['page']);
      page_path = Connect_Window.location.pathname + page_hash;

      if (Connect.page_cargo.search_query !== undefined) {
        event_type = 'search_page_view';
        search_query = Connect.page_cargo.search_query;

        Analytics.event_type = event_type;
        Analytics.event_data = {
          title: page_title,
          location: page_location,
          path: page_path,
          query: search_query
        };
      } else {
        event_type = 'page_view';

        Analytics.event_type = event_type;
        Analytics.event_data = {
          title: page_title,
          location: page_location,
          path: page_path
        };
      }

      Analytics.CaptureEvent();
    }

    // Highlight search words
    //
    if (Connect.page_cargo.search_query !== undefined) {

      data = {
        'action': 'page_search_query_highlight',
        'search_query': Connect.page_cargo.search_query,
        'search_synonyms': Connect.page_cargo.search_synonyms
      };
      Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);

      // Reset page cargo
      //
      Connect.page_cargo = {};
    }

    // Adjust for content size
    //
    if (param_same_document) {
      Connect.AdjustLayoutForBrowserSize();
    } else {
      Connect.OnResize();

      // Update anchors
      //
      data = {
        'action': 'update_anchors',
        'target': Connect_Window.name,
        'base_url': Connect.base_url,
        'parcel_prefixes': Connect.parcel_prefixes,
        'button_behaviors': {},
        'email': Connect.email,
        'email_message': Connect.email_message
      };
      for (behavior in Connect.button_behaviors) {
        if (typeof Connect.button_behaviors[behavior] === 'function') {
          data.button_behaviors[behavior] = true;
        }
      }
      Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
    }
  }
};

Connect.Socialize = function () {
  'use strict';

  var data;

  // Socialize
  //
  data = {
    'action': 'page_socialize',
    'disqus_id': Connect.disqus_id
  };
  Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
};

Connect.Globalize = function () {
  'use strict';

  var data;

  // Google Translation
  //
  if (Connect.globe_enabled) {
    data = {
      'action': 'page_globalize'
    };
    Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
  }
};

Connect.SearchQueryHighlight = function (param_search_query, param_search_synonyms) {
  'use strict';

  var data;

  data = {
    'action': 'page_search_query_highlight',
    'search_query': param_search_query,
    'search_synonyms': param_search_synonyms
  };
  Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
};

Connect.AdjustForSearchContentSize = function () {
  'use strict';

  var data;

  data = {
    'action': 'search_get_page_size',
    'stage': 'height'
  };
  Message.Post(Connect.search_iframe.contentWindow, data, Connect_Window);
};

Connect.EnableDisableButton = function (param_button_behavior, param_ccs_class_prefix, param_enable) {
  'use strict';

  var button_span, updated_className;

  button_span = Connect.buttons[param_button_behavior];
  if (button_span !== undefined) {
    // Update class name
    //
    updated_className = button_span.className;
    updated_className = Browser.RemoveClass(updated_className, 'ww_skin_toolbar_button_enabled');
    updated_className = Browser.RemoveClass(updated_className, 'ww_skin_toolbar_button_disabled');
    if (param_enable) {
      // Enable
      //
      updated_className = Browser.AddClass(updated_className, 'ww_skin_toolbar_button_enabled');
    } else {
      // Disable
      //
      updated_className = Browser.AddClass(updated_className, 'ww_skin_toolbar_button_disabled');
    }
    button_span.className = updated_className;
  }
};

Connect.Listen = function (param_event) {
  'use strict';

  // Initialize listen dispatcher
  //
  if (Connect.dispatch_listen === undefined) {
    Connect.dispatch_listen = {
      'page_load': function (param_data) {
        Connect.page_info = param_data;
        delete Connect.page_info['action'];

        Connect.OnDocumentLoad();
        Connect.ignore_page_load = true;
      },
      'page_unload': function (param_data) {
        Connect.page_info = undefined;
        Connect.OnDocumentUnload();
      },
      'page_size': function (param_data) {
        if (Connect.page_info !== undefined) {
          // Clear fallback, if present
          //
          Connect.container_div.className = Browser.RemoveClass(Connect.container_div.className, 'unknown_page');

          if (param_data.stage === 'height') {
            var height;

            if (Connect.page_info.dimensions.height !== param_data.dimensions.height) {
              Connect.page_info.dimensions.height = param_data.dimensions.height;
            }

            height = String(Connect.page_info.dimensions.height) + 'px';

            if (Connect.page_div.style.height !== height) {
              Connect.page_div.style.height = height;
            }

            Connect.Menu.CalculateMenuSize();
            // Notify page resize complete
            //
            data = {
              'action': 'resize_complete'
            };
            Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
          }
        }
      },
      'page_bookkeeping': function (param_data) {
        // Document bookkeeping
        //
        if (param_data.href !== undefined) {
          Connect.page_info.href = param_data.href;
        }
        if (param_data.hash !== undefined) {
          Connect.page_info.hash = param_data.hash;
        }
        Connect.DocumentBookkeeping(true);
      },
      'page_content_changed': function (param_data) {
        // Initiate resize operation
        //
        Connect.OnResize();
      },
      'page_scroll_view': function (param_data) {
        var scroll_position, top, browser_widthheight;

        // Update scroll location to display page data
        //
        scroll_position = Browser.GetElementScrollPosition(Connect.page_iframe);

        // Determine final scroll position and scroll
        //
        top = scroll_position.top + param_data.top;
        browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);
        if (top < (browser_widthheight.height / 2)) {
          top = 0;
        }

        Connect.ScrollTo(0, top);
      },
      'back_to_top': function (param_data) {
        if (!Connect.layout_wide) {
          Connect.ScrollTo(0, 0);
        }
      },
      'handle_toolbar_link': function (param_data) {
        // Invoke toolbar link
        //
        Connect.button_behaviors[param_data.behavior]();
      },
      'display_link': function (param_data) {
        if ((param_data.target === undefined) || (param_data.target === null) || (param_data.target === '') || param_data.target === '_self' || (param_data.target === 'connect_page')) {
          // Use existing page iframe
          //
          Connect.DisplayPage(param_data.href, false);
        } else {
          // Display in requested window
          //
          Connect_Window.open(param_data.href, param_data.target);
        }
      },
      'display_image': function (param_data) {
        Connect.DisplayFullsizeImage(param_data);
      },
      'search_page_load': function (param_data) {
        var data;

        // Record page info
        //
        Connect.search_page_info = param_data;
        delete Connect.search_page_info['action'];

        data = {
          'action': 'search_connect_info',
          'target': Connect_Window.name,
          'base_url': Connect.base_url,
          'parcel_prefixes': Connect.parcel_prefixes,
          'parcel_sx': Connect.parcel_sx,
          'query': Connect.search_query
        };

        if (Connect.scope_enabled) {
          var search_scope_selection_titles_string;

          search_scope_selection_titles_string = Scope.GetSearchScopeSelectionTitlesString();

          data['search_scopes'] = Scope.search_scopes;
          data['search_scope_map'] = Scope.search_scope_map;
          data['search_scope_selections'] = Scope.search_scope_selections;
          data['search_scope_selection_titles'] = search_scope_selection_titles_string;
        }

        // Send search file list
        //
        Message.Post(Connect.search_iframe.contentWindow, data, Connect_Window);
      },
      'search_ready': function (param_data) {
        var data;

        // Search panel displayed?
        //
        if (Connect.search_div.parentNode !== Connect.panels_div) {
          // Execute search
          //
          data = {
            'action': 'search_execute',
            'query': Connect.search_query
          };
          Message.Post(Connect.search_iframe.contentWindow, data, Connect_Window);
        }
      },
      'search_complete': function (param_data) {
        // Update search words
        //
        Connect.search_query = param_data.query;
        Connect.search_synonyms = param_data.synonyms;

        // Update dimensions
        //
        Connect.search_page_info.dimensions = param_data.dimensions;

        // Adjust layout for search content
        //
        Connect.AdjustForSearchContentSize();
      },
      'search_page_size': function (param_data) {
        var data;

        // Update dimensions
        //
        Connect.search_page_info.dimensions = param_data.dimensions;

        // Handle resize
        //
        if (param_data.stage === 'height') {
          // Set content height
          //
          Connect.search_div.style.height = String(Connect.search_page_info.dimensions.height) + 'px';

          // Workaround Google Chrome refresh issue
          //
          Connect.search_iframe.style.height = '';
          Connect.search_iframe.style.height = Connect.search_page_info.dimensions.height;
        }
        Connect.Menu.CalculateMenuSize();
      },
      'search_display_link': function (param_data) {
        // Track search words
        //
        Connect.page_cargo.search_href = param_data.href;
        Connect.page_cargo.search_title = param_data.title;
        Connect.page_cargo.search_query = Connect.search_query;
        Connect.page_cargo.search_synonyms = Connect.search_synonyms;
        // add page_cargo.pathname

        // Display specified page
        //
        if (param_data.href !== undefined) {
          Connect_Window.setTimeout(function () {
            Connect.DisplayPage(param_data.href, true);
          }, 10);
        }
      },
      'page_clicked': function (param_data) {
        if (Connect.scope_enabled) {
          Scope.CloseDropDown();
        }
        if (Connect.google_analytics_enabled) {
          Analytics.event_type = 'page_click';
          Analytics.CaptureEvent();
        }
      },
      'search_page_clicked': function (param_data) {
        if (Connect.scope_enabled) {
          Scope.CloseDropDown();
        }
      }
    };
  }

  // Dispatch event
  //
  try {
    Connect.dispatch_listen[param_event.data.action](param_event.data);
  } catch (ignore) {
    // Keep on rolling
    //
  }
};

Connect.UpdateTitle = function () {
  'use strict';

  var title, page_document;

  // Determine title
  //
  title = '';
  if (Connect.SearchEnabled()) {
    // Make the search title custom from a Target Setting
    //
    title = Connect.search_title;
    if (Connect.search_query !== undefined && Connect.search_query.length > 0) {
      title += ': ' + Connect.search_query;
    }
  } else if (Connect.page_info !== undefined) {
    title = Connect.page_info.title;
  } else {
    page_document = Browser.GetDocument(Connect.page_iframe);
    if (page_document !== undefined) {
      title = page_document.title;
    }
  }

  // Set title
  //
  Connect.SetTitle(title);
};

Connect.SetTitle = function (param_title) {
  'use strict';

  // Update window title
  //
  Connect_Window.document.title = param_title;
};

Connect.UpdatePrevNext = function () {
  'use strict';

  var enable_button, prevnext_link, search_enabled;

  // Update prev/next
  //
  search_enabled = Connect.SearchEnabled();
  prevnext_link = Connect.GetPrevNext('Prev');
  enable_button = (prevnext_link !== undefined && !search_enabled);
  Connect.EnableDisableButton('ww_behavior_prev', 'ww_skin_prev', enable_button);
  prevnext_link = Connect.GetPrevNext('Next');
  enable_button = (prevnext_link !== undefined && !search_enabled);
  Connect.EnableDisableButton('ww_behavior_next', 'ww_skin_next', enable_button);
};

Connect.OnDocumentLoad = function () {
  'use strict';

  // Environment initialized?
  //
  if (Connect.ignore_page_load) {
    Connect.ignore_page_load = false;
  } else {
    if (Connect.parcels_loaded_initial) {
      var enable_button;

      // Document bookkeeping
      //
      Connect.DocumentBookkeeping(false);

      // Update title
      //
      Connect.UpdateTitle();

      // Update home
      //
      enable_button = ((Connect.page_info === undefined) || (!Browser.SameDocument(Connect.default_page_url, Connect.page_info.href)) || Connect.SearchEnabled());
      Connect.EnableDisableButton('ww_behavior_home', 'ww_skin_home', enable_button);

      // Update prev/next
      //
      Connect.UpdatePrevNext();

      // Socialize and Globalize
      //
      Connect_Window.setTimeout(function () {
        Connect.Socialize();
        Connect.Globalize();
      }, 1);

      // Double-check sizing
      //
      Connect.OnResize();

      // Need to load remaining parcels?
      //
      if ((!Connect.parcels_loaded_all) && (!Connect.parcels_loading_remaining)) {
        // Complete parcel loading
        //
        Connect.parcels_loading_remaining = true;
        Connect_Window.setTimeout(function () {
          Connect.Parcels_LoadRemaining(Connect.parcels_remaining);
        }, 100);
      }
    }
  }
};

Connect.OnDocumentUnload = function () {
  'use strict';

  Connect.page_first_scroll = true;

  Connect.UpdateTitle();
};

Connect.DisplayFullsizeImage = function (param_image_data) {
  'use strict';

  var display_in_lightbox, browser_widthheight, fullsize_image;

  // Always display images in lightbox?
  //
  display_in_lightbox = Connect.lightbox_large_images;
  if (!display_in_lightbox) {
    // Retrieve width/height info
    //
    browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);

    // Enough room for lightbox?
    //
    if (((param_image_data.width + Connect.lightbox_min_pixel_margin) < browser_widthheight.width) && ((param_image_data.height + Connect.lightbox_min_pixel_margin) < browser_widthheight.height)) {
      display_in_lightbox = true;
    }
  }

  // Display in lightbox?
  //
  if (display_in_lightbox) {
    // Create image to display
    //
    fullsize_image = Connect_Window.document.createElement('img');
    Browser.SetAttribute(fullsize_image, 'width', param_image_data.width);
    Browser.SetAttribute(fullsize_image, 'height', param_image_data.height);
    Browser.SetAttribute(fullsize_image, 'src', param_image_data.src);

    // Display lightbox
    //
    Connect.Lightbox.Display(
      function (param_lightbox_frame, param_lightbox_content) {
        Browser.SetAttribute(param_lightbox_frame, 'style', 'height: ' + String(param_image_data.height + 2) + 'px');
        param_lightbox_content.innerHTML = '';
        param_lightbox_content.appendChild(fullsize_image);
      },
      function (param_lightbox_frame, param_lightbox_content) {
        param_lightbox_content.removeChild(fullsize_image);
        Browser.RemoveAttribute(param_lightbox_frame, 'style', '');
      }
    );
  } else {
    // Replace displayed document
    //
    Connect.DisplayPage(param_image_data.href, false);
  }
};

Connect.ScrollToMenuElement = function (param_element) {
  'use strict';

  var browser_widthheight, menu_height, element_scroll_position,
    menu_75_height, menu_50_height, target_scroll_top,
    menu_frame_scroll_position;

  // Narrow or wide layout?
  //
  if ((Connect.layout_wide) || (Connect.layout_tall)) {
    // Scroll to element position
    //
    browser_widthheight = Browser.GetBrowserWidthHeight(Connect_Window);
    menu_height = browser_widthheight.height - Connect.layout_top;

    element_scroll_position = Browser.GetElementScrollPosition(param_element, Connect.menu_frame_div);
    menu_75_height = Math.floor(menu_height * 0.75);
    menu_50_height = Math.floor(menu_height * 0.5);
    if ((element_scroll_position.top >= Connect.menu_frame_div.scrollTop) &&
      (element_scroll_position.top <= (Connect.menu_frame_div.scrollTop + menu_75_height))) {
      // Do nothing
      //
      target_scroll_top = Connect.menu_frame_div.scrollTop;
    } else {
      if (element_scroll_position.top < menu_75_height) {
        target_scroll_top = 0;
      } else {
        target_scroll_top = element_scroll_position.top - menu_50_height;
      }
    }
    Connect.menu_frame_div.scrollTop = target_scroll_top;
  } else {
    menu_frame_scroll_position = Browser.GetElementScrollPosition(Connect.menu_frame_div);
    element_scroll_position = Browser.GetElementScrollPosition(param_element);

    Connect.ScrollTo(
      menu_frame_scroll_position.left + element_scroll_position.left,
      menu_frame_scroll_position.top + element_scroll_position.top
    );
  }
};

Connect.SyncTOC = function (param_cleanup_folders) {
  'use strict';

  var entry_state, toc_entry, entry_div, folder_exceptions,
    parent_ul, parent_entry_div, button_span;

  // Clear highlight
  //
  if (Connect.toc_selected_entry_key !== undefined) {
    entry_state = Connect.toc_class_states[Connect.toc_selected_entry_key];
    if (entry_state !== undefined) {
      entry_state.element.className = entry_state.className;
    }

    Connect.toc_selected_entry_key = undefined;
  }

  // Locate TOC entry
  //
  toc_entry = Connect.LocateTOCEntry();

  // Expand TOC for context
  //
  if (toc_entry !== null) {
    // Highlight entry
    //
    entry_div = Browser.FirstChildElementWithTagName(toc_entry, 'div');
    if (entry_div !== null) {
      // Clean up folders?
      //
      if (param_cleanup_folders) {
        folder_exceptions = {};
        if (Browser.ContainsClass(entry_div.className, 'ww_skin_toc_folder')) {
          folder_exceptions[Connect.TOC_ElementKey(entry_div)] = true;
        }
        parent_ul = Browser.FindParentWithTagName(entry_div, 'ul');
        while (parent_ul !== null) {
          parent_entry_div = Browser.PreviousSiblingElementWithTagName(parent_ul, 'div');
          if (parent_entry_div !== null) {
            if (Browser.ContainsClass(parent_entry_div.className, 'ww_skin_toc_folder')) {
              folder_exceptions[Connect.TOC_ElementKey(parent_entry_div)] = true;
            }
          }

          parent_ul = Browser.FindParentWithTagName(parent_ul, 'ul');
        }
        Connect.TOC_RestoreClassStates(folder_exceptions);
      }

      // Highlight
      //
      Connect.TOC_RecordClassState(entry_div);
      entry_div.className = Browser.AddClass(entry_div.className, 'ww_skin_toc_entry_selected');
      Connect.toc_selected_entry_key = Connect.TOC_ElementKey(entry_div);

      // Expand entry and parents
      //
      Connect.TOCFolder_Open(entry_div);
      parent_ul = Browser.FindParentWithTagName(entry_div, 'ul');
      while (parent_ul !== null) {
        parent_entry_div = Browser.PreviousSiblingElementWithTagName(parent_ul, 'div');
        if (parent_entry_div !== null) {
          Connect.TOCFolder_Open(parent_entry_div);
        }

        parent_ul = Browser.FindParentWithTagName(parent_ul, 'ul');
      }

      // Scroll to TOC position if TOC displayed
      //
      button_span = Connect.buttons['ww_behavior_toc'];
      if ((button_span !== undefined) && (Browser.ContainsClass(button_span.className, 'ww_skin_toolbar_background_selected'))) {
        Connect.ScrollToMenuElement(toc_entry);
      }
    }
  }
};

Connect.Button_Home = function () {
  'use strict';

  if (!Connect.ButtonDisabled(Connect.buttons['ww_behavior_home'])) {
    // Go to default page
    //
    Connect.DisplayPage(Connect.default_page_url, true);
  }
};

Connect.Button_External = function (param_link) {
  'use strict';

  if (param_link !== null) {
    var link_href;

    link_href = param_link.href;
    // Follow Link
    //
    if (link_href !== undefined && link_href !== '#') {
      window.open(link_href, '_blank');
    }
  }
};

Connect.Button_TOC = function () {
  'use strict';

  var button_span;

  button_span = Connect.buttons['ww_behavior_toc'];

  if (Connect.Menu.Enabled && Connect.Menu.menu_mode_visible !== 'toc') {

    // Move the Index back to the panels div
    //
    Connect.panels_div.appendChild(Connect.index_div);

    // Show
    //
    Connect.Menu.Display(
      function (param_window, param_menu_content) {
        // Highlight toolbar button
        //
        if (button_span !== undefined) {
          button_span.className = Browser.ReplaceClass(button_span.className, 'ww_skin_toolbar_background_default', 'ww_skin_toolbar_background_selected');
        }

        // Set title
        //
        Connect.SetTitle('WebWorks Reverb 2.0');

        // Sync TOC
        //
        Connect.SyncTOC(Connect.toc_cleanup_folders);

        // On Stage
        //
        if (Connect.buttons['ww_behavior_toc'] !== undefined && Connect.buttons['ww_behavior_index']) {
          param_menu_content.appendChild(Connect.nav_buttons_div);
        }

        param_menu_content.appendChild(Connect.toc_div);

        // Retry Sync TOC if necessary
        // (come back to this... do we need?)
        //
        Connect_Window.setTimeout(function () {
          Connect.SyncTOC(Connect.toc_cleanup_folders);
        }, 10);
      },
      function (param_window, param_menu_content) {
        // Backstage
        //
        Connect.panels_div.appendChild(Connect.toc_div);

        // Update title
        //
        Connect.UpdateTitle();

        // Restore class info
        //
        Connect.TOC_RestoreClassStates();

        // Highlight toolbar button
        //
        if (button_span !== undefined) {
          button_span.className = Browser.ReplaceClass(button_span.className, 'ww_skin_toolbar_background_selected', 'ww_skin_toolbar_background_default');
        }
      });
    Connect.sidebar_behavior = 'ww_behavior_toc';
    Connect.Menu.menu_mode_visible = 'toc';
  } else {
    // Do nothing
    //
  }
};

Connect.Button_Index = function () {
  'use strict';

  var button_span;

  button_span = Connect.buttons['ww_behavior_index'];

  if (Connect.Menu.Enabled && Connect.Menu.menu_mode_visible !== 'index') {

    // Move the TOC back over to the panels div
    //
    Connect.panels_div.appendChild(Connect.toc_div);

    // Show
    //
    Connect.Menu.Display(
      function (param_window, param_menu_content) {
        // Set title
        //
        Connect.SetTitle('WebWorks Reverb 2.0');

        // Highlight toolbar button
        //
        if (button_span !== undefined) {
          button_span.className = Browser.ReplaceClass(button_span.className, 'ww_skin_toolbar_background_default', 'ww_skin_toolbar_background_selected');
        }

        if (Connect.buttons['ww_behavior_toc'] !== undefined && Connect.buttons['ww_behavior_index']) {
          param_menu_content.appendChild(Connect.nav_buttons_div);
        }
        // On Stage
        //
        if (!Connect.parcel_ix_loaded) {
          if (Connect.parcel_ix_loading) {
            // Show progress
            //
            param_menu_content.appendChild(Connect.index_progress_div);
            Connect.index_progress.Show();
          } else {
            // Show progress
            //
            Connect.index_progress.Reset();
            param_menu_content.appendChild(Connect.index_progress_div);
            Connect.index_progress.Show();

            // Initiate index load
            //
            Connect.parcel_ix_loading = true;
            Connect.index_content_div.innerHTML = '';
            Connect_Window.setTimeout(Connect.Index_Load, 1);
          }
        } else {
          // Show index
          //
          param_menu_content.appendChild(Connect.index_div);
        }
      },
      function (param_window, param_menu_content) {
        // Hide progress
        //
        Connect.index_progress.Hide();
        Connect.panels_div.appendChild(Connect.index_progress_div);

        // Backstage
        //
        Connect.panels_div.appendChild(Connect.index_div);

        // Update title
        //
        Connect.UpdateTitle();

        // Highlight toolbar button
        //
        if (button_span !== undefined) {
          button_span.className = Browser.ReplaceClass(button_span.className, 'ww_skin_toolbar_background_selected', 'ww_skin_toolbar_background_default');
        }
      });
    Connect.sidebar_behavior = 'ww_behavior_index';
    Connect.Menu.menu_mode_visible = 'index';
  } else {
    // Do nothing
    //
  }
};

Connect.Index_Load = function () {
  'use strict';

  var index, parcel_id, parcel_entry_placeholder_div, ajaxdata;

  // All parcels loaded?
  //
  if (!Connect.parcels_loaded_all) {
    // Wait for all parcel data to be loaded
    //
    Connect_Window.setTimeout(Connect.Index_Load, 100);
    return;
  }

  // Prepare index for data load
  //
  for (index = 0; index < Connect.parcel_ids.length; index += 1) {
    parcel_id = Connect.parcel_ids[index];

    // Emit index placeholders
    //
    parcel_entry_placeholder_div = Connect_Window.document.createElement('div');
    parcel_entry_placeholder_div.id = 'parcel_index:' + parcel_id;
    parcel_entry_placeholder_div.className = 'ww_skin_index_title';
    parcel_entry_placeholder_div.innerHTML = Connect.parcel_title[parcel_id];

    Connect.index_content_div.appendChild(parcel_entry_placeholder_div);
  }

  // Load index data
  //
  ajaxdata = new AJAXData_Object(
    Connect.parcel_ix,
    function (param_entry) {
      return param_entry.url;
    },
    function (param_percent) {
      Connect.index_progress.Update(param_percent);
    },
    function (param_entry, param_ajax) {
      var parcel_data, parcel_entry_div_id, parcel_entry_div,
        parcel_index_div_id, parcel_index_div;

      // Access parcel data
      //
      parcel_data = Connect_Window.document.createElement('div');
      parcel_data.style.visibility = 'hidden';
      parcel_data.innerHTML = param_ajax.responseText;
      Connect_Window.document.body.appendChild(parcel_data);

      // Index
      //
      parcel_entry_div_id = 'parcel_index:' + param_entry.id;
      parcel_entry_div = Connect_Window.document.getElementById(parcel_entry_div_id);
      if (parcel_entry_div !== null) {
        parcel_index_div_id = 'index:' + param_entry.id;
        parcel_index_div = Connect_Window.document.getElementById(parcel_index_div_id);
        if ((parcel_index_div !== null) && (parcel_index_div.innerHTML.length > 0)) {
          if (parcel_entry_div.nextSibling !== null) {
            Connect.index_content_div.insertBefore(parcel_index_div, parcel_entry_div.nextSibling);
          } else {
            Connect.index_content_div.appendChild(parcel_index_div);
          }
        } else {
          Connect.index_content_div.removeChild(parcel_entry_div);
        }
      }

      // Remove parcel data
      //
      Connect_Window.document.body.removeChild(parcel_data);
    },
    function () {
      var button_span;

      // Parcel indexes loaded!
      //
      Connect.parcel_ix_loaded = true;

      // Intercept all clicks
      //
      Browser.ApplyToChildElementsWithTagName(
        Connect.index_div,
        'a',
        function (param_link) {
          param_link.onclick = Connect.IndexLink;
        }
      );

      // Done!
      //
      Connect.index_progress.Complete();
      Connect.panels_div.appendChild(Connect.index_progress_div);

      // Menu currently displayed?
      //
      button_span = Connect.buttons['ww_behavior_index'];
      if ((button_span !== undefined) && (Browser.ContainsClass(button_span.className, 'ww_skin_toolbar_background_selected'))) {
        // On stage!
        //
        Connect.Menu.menu_content.appendChild(Connect.index_div);
      }
    });
  ajaxdata.Execute();
};

Connect.Button_Search = function () {
  'use strict';

  var search_enabled;

  search_enabled = Connect.SearchEnabled();
  search_enabled = search_enabled ? false : true;

  if (search_enabled) {
    // Do the search
    //
    Connect.HandleSearchURL();
  } else {
    // Go back to the content page
    //
    Connect.BackToCurrentPage();
  }
};

Connect.Button_Globe = function () {
  'use strict';

  var button_span, page_document;

  // Menu visible in mobile?
  //
  if (Connect.Menu.Enabled && Connect.Menu.Visible() && !Connect.layout_wide) {
    // Hide
    //
    Connect.Menu.Hide();
  }

  // Enabled?
  //
  button_span = Connect.buttons['ww_behavior_globe'];
  if (!Connect.globe_enabled) {
    // Highlight toolbar button
    //
    if (button_span !== undefined) {
      button_span.className = Browser.ReplaceClass(button_span.className, 'ww_skin_toolbar_background_default', 'ww_skin_toolbar_background_selected');
    }

    // Globalize
    //
    Connect.globe_enabled = true;
    Connect_Window.setTimeout(Connect.Globalize, 1);
  } else {
    // Disable globalization
    //
    Connect.globe_enabled = false;
    page_document = Browser.GetDocument(Connect.page_iframe);
    if (page_document !== undefined) {
      Connect_Window.setTimeout(function () {
        page_document.location.reload();
      }, 1);
    }

    // Highlight toolbar button
    //
    if (button_span !== undefined) {
      button_span.className = Browser.ReplaceClass(button_span.className, 'ww_skin_toolbar_background_selected', 'ww_skin_toolbar_background_default');
    }
  }
};

Connect.Button_Menu_Toggle = function () {
  'use strict';

  var menu_opened, menu_closed, menu_initial, layout_narrow;

  menu_opened = Browser.ContainsClass(Connect.presentation_div.className, 'menu_open');
  menu_closed = Browser.ContainsClass(Connect.presentation_div.className, 'menu_closed');
  menu_initial = Browser.ContainsClass(Connect.presentation_div.className, 'menu_initial');
  layout_narrow = Browser.ContainsClass(Connect.layout_div.className, 'layout_narrow');

  menu_opened = menu_opened && !(menu_initial && layout_narrow);

  if (menu_opened) {
    Connect.Menu.Hide();
  }
  else if (menu_closed) {
    Connect.Menu.Show();
  }
  else {
    Connect.Menu.Show();
  }
};

Connect.GetPrevNext = function (param_prevnext) {
  'use strict';

  var result;

  if (Connect.page_info !== undefined) {
    result = Connect.page_info[param_prevnext];
    if (result === undefined) {
      // Spanning parcels?
      //
      if (Connect.link_bridge.Get(param_prevnext, Connect.page_info.id) !== null) {
        result = Connect.link_bridge.Get(param_prevnext, Connect.page_info.id);
      }
    }
  }

  return result;
};

Connect.GotoPrevNext = function (param_prevnext) {
  'use strict';

  var link_href;

  link_href = Connect.GetPrevNext(param_prevnext);
  if (link_href !== undefined) {
    Connect.DisplayPage(link_href, true);
  }
};

Connect.Button_Previous = function () {
  'use strict';

  if (!Connect.ButtonDisabled(Connect.buttons['ww_behavior_prev'])) {
    // Menu visible in mobile?
    //
    if (Connect.Menu.Enabled && Connect.Menu.Visible() && !Connect.layout_wide) {
      // Hide
      //
      Connect.Menu.Hide();
    }

    Connect.GotoPrevNext('Prev');
  }
};

Connect.Button_Next = function () {
  'use strict';

  if (!Connect.ButtonDisabled(Connect.buttons['ww_behavior_next'])) {
    // Menu visible in mobile?
    //
    if (Connect.Menu.Enabled && Connect.Menu.Visible() && !Connect.layout_wide) {
      // Hide
      //
      Connect.Menu.Hide();
    }

    Connect.GotoPrevNext('Next');
  }
};

Connect.Button_Email = function () {
  'use strict';

  var message, mailto;

  // Menu visible in mobile?
  //
  if (Connect.Menu.Enabled && Connect.Menu.Visible() && !Connect.layout_wide) {
    // Hide
    //
    Connect.Menu.Hide();
  }

  if ((Connect.email.length > 0) && (Connect.email_message.length > 0)) {
    message = Connect.email_message.replace('$Location;', Connect_Window.location.href);
    if (Connect_Window.navigator.userAgent.indexOf('MSIE') !== -1) {
      message = message.replace('#', '%23');
    }
    mailto = 'mailto:' + Connect.email + '?subject=' + encodeURIComponent(message) + '&body=' + encodeURIComponent(message);

    Connect_Window.open(mailto, '_blank');
  }
};

Connect.Button_Print = function () {
  'use strict';

  var page_window, data;

  // Try direct method
  //
  try {
    page_window = Connect.page_iframe.contentWindow || Connect_Window.frames['connect_page'];
    if ((page_window !== undefined) && (page_window !== null)) {
      page_window.print();
    }
  } catch (ignore) {
    // Try page action
    //
    data = {
      'action': 'ww_behavior_print'
    };
    Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
  }
};

Connect.Button_PDF = function () {
  'use strict';

  var data;

  // Try page action
  //
  data = {
    'action': 'ww_behavior_pdf'
  };
  Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
};

Connect.ScrollTo = function (x, y) {
  'use strict';

  Connect.container_div.scrollTop = x;
  Connect.container_div.scrollLeft = y;
};

Connect.SearchEnabled = function () {
  'use strict';

  var search_enabled;

  search_enabled = Browser.ContainsClass(presentation_div.className, 'search_enabled');

  return search_enabled;
};

Connect.ShowSearchPage = function () {
  'use strict';

  Connect.presentation_div.className = Browser.AddClass(Connect.presentation_div.className, 'search_enabled');

  Connect.EnableDisableButton('ww_behavior_prev', 'ww_skin_prev', false);
  Connect.EnableDisableButton('ww_behavior_next', 'ww_skin_next', false);
  Connect.EnableDisableButton('ww_behavior_home', 'ww_skin_home', true);

  Connect.Menu.CalculateMenuSize();
};

Connect.HideSearchPage = function () {
  'use strict';

  Connect.presentation_div.className = Browser.RemoveClass(Connect.presentation_div.className, 'search_enabled');

  Connect.UpdatePrevNext();
  Connect.Menu.CalculateMenuSize();
};

Connect.LoadSearchPage = function () {
  'use strict';

  Connect_Window.setTimeout(function () {
    var target_href, same_document, data, guessed_height;

    target_href = Connect.search_page_url;

    // Display target href if not already handled
    //
    if (target_href !== undefined) {
      // Reset back to top
      //
      if (Connect.back_to_top_element !== null) {
        Connect.back_to_top_element.className = Browser.RemoveClass(Connect.back_to_top_element.className, 'back_to_top_show');
      }

      // Display document as page
      //
      if (('onhashchange' in Connect_Window) && (typeof Connect_Window.history.pushState === 'function')) {
        Connect.search_iframe.contentWindow.location.replace(target_href);
      } else {
        Connect.search_iframe.contentWindow.location.assign(target_href);
      }
    }
  }, 1);
};

Connect.HandleSearch = function () {
  'use strict';

  if (Connect.search_query !== undefined) {
    var data, search_query, search_enabled;

    search_query = Connect.search_query;
    search_enabled = Connect.SearchEnabled();

    if ((search_query.length > 0 && search_query.length < 3) &&
      !search_enabled) {
      // First or second letter typed, show the page.
      // Clear the results
      //
      Connect.ShowSearchPage();
      search_query = '';
    } else if (search_query.length === 0 || search_query.length > 2) {
      // Zero characters, fine, send off to clear results
      // At least 3 characters, also fine, begin searching
      //
    }

    Connect.search_query = search_query;

    data = {
      'action': 'search_connect_info',
      'target': Connect_Window.name,
      'base_url': Connect.base_url,
      'parcel_prefixes': Connect.parcel_prefixes,
      'parcel_sx': Connect.parcel_sx,
      'query': Connect.search_query
    };

    if (Connect.scope_enabled) {
      var search_scope_selection_titles_string;

      search_scope_selection_titles_string = Scope.GetSearchScopeSelectionTitlesString();

      data['search_scopes'] = Scope.search_scopes;
      data['search_scope_map'] = Scope.search_scope_map;
      data['search_scope_selections'] = Scope.search_scope_selections;
      data['search_scope_selection_titles'] = search_scope_selection_titles_string;
    }

    Message.Post(Connect.search_iframe.contentWindow, data, Connect_Window);

  }
  Connect.UpdateTitle();
};

Connect.HandleSearchURL = function () {
  'use strict';

  var page_href, search_url, search_hash;

  // Initialize
  //
  page_href = Connect_Window.location.href;
  search_hash = '#search/';

  if (Connect_Window.location.hash.length > 0) {
    // Get the base href
    //
    page_href = page_href.substring(0, page_href.lastIndexOf(Connect_Window.location.hash));
  }
  if (Connect.search_query !== undefined) {
    // Add the search words to the search hash
    //
    search_hash += encodeURIComponent(Connect.search_query);
  }

  search_url = page_href + search_hash;

  if (Connect.scope_enabled) {
    if (Scope.search_scope_selections.length > 0 && Scope.search_scope_selections[0] !== 'all') {
      // Build search scope hash
      //
      var scope_hash, scope_selections, scope_selections_string;

      scope_hash = '#scope/';

      scope_selections = [];
      scope_selections_string = '';

      for (var i = 0; i < Scope.search_scope_selections.length; i++) {
        var scope_selection, scope_title;

        scope_selection = Scope.search_scope_selections[i];
        scope_title = Scope.search_scopes[scope_selection].title;

        scope_title = encodeURIComponent(scope_title);
        scope_selections.push(scope_title);
      }

      scope_selections_string = scope_selections.join('/');
      scope_hash += scope_selections_string;

      if (scope_hash.length > '#scope/'.length) {
        search_url += scope_hash;
      }
    }
  }

  delete Connect.url_handler_object['page'];

  if (Connect.url_handler_object['parcels'] !== undefined) {
    var parcels_hash;

    parcels_hash = '#parcels/' + Connect.url_handler_object['parcels'];

    search_url += parcels_hash;
  }

  if (('onhashchange' in Connect_Window) && (typeof Connect_Window.history.pushState === 'function')) {
    if (Connect_Window.location.hash.indexOf('#search/') > -1) {
      Connect_Window.location.replace(search_url);
    }
    else {
      Connect_Window.location.assign(search_url);
    }
  }
  else {
    Connect_Window.location.replace(search_url);
  }
};

Connect.BackToCurrentPage = function () {
  'use strict';

  var data;

  // Clear search results, display the
  // page that we were on last
  //
  Connect.search_input.value = '';
  Connect.search_query = '';

  if (Connect.page_info !== undefined) {


    data = {
      'action': 'page_search_query_highlight',
      'search_query': Connect.page_cargo.search_query,
      'search_synonyms': Connect.page_cargo.search_synonyms
    };
    Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);

    Connect.DisplayPage(Connect.page_info.href, false);
  } else {
    // Search must have been the first place we landed,
    // Load splash page
    //
    Connect.DisplayPage(Connect.splash_page_url, false);
  }
};

Connect.UpdatePageHeight = function () {
  'use strict';

  var height, data;

  data = {
    'action': 'get_page_size',
    'stage': 'height'
  };
  Message.Post(Connect.page_iframe.contentWindow, data, Connect_Window);
};

Connect.ButtonDisabled = function (param_button) {
  'use strict';

  var is_disabled;

  // Be permissive with this one because we only want to stop certain behavior
  //
  is_disabled = false;

  if (param_button && typeof param_button === 'object') {
    is_disabled = Browser.ContainsClass(param_button.className, 'ww_skin_toolbar_button_disabled');
  }

  return is_disabled;
};

Connect.BrowserSupported = function () {
  'use strict';

  var browser_supported, is_IE, user_agent, version_regex, IE_version;

  browser_supported = true;

  is_IE = false || !!document.documentMode;

  if (is_IE) {
    user_agent = navigator.userAgent;
    version_regex = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");

    if (version_regex.exec(user_agent) != null) {
      IE_version = parseFloat(RegExp.$1);
    }

    if (IE_version <= 10) {
      browser_supported = false;
    }
  }

  return browser_supported;
};

Connect.DisplayUnsupportedBrowserView = function () {
  'use strict';

  var body, unsupported_browser_element;

  body = document.body;
  unsupported_browser_element = document.getElementById('unsupported_browser').outerHTML;

  body.innerHTML = unsupported_browser_element;
};

window.onclick = function (param_event) {
  'use strict';

  if (Connect.scope_enabled) {
    var is_child_of_options, is_child_of_selector;

    is_child_of_selector = Browser.IsChildOfNode(param_event.target, document.getElementById('search_scope'));
    is_child_of_options = Browser.IsChildOfNode(param_event.target, document.getElementById('search_scope_options'));

    if (!is_child_of_selector && !is_child_of_options) {
      Scope.CloseDropDown();
    }
  }
};