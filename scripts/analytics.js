// Copyright Quadralay Corporation 2018 - 2018
//

// Set Default Tracker ID from target setting
//
var Analytics = {};

Analytics.ga_tracking_id = 'UA-1392910-1';

Analytics.event_type = '';
Analytics.event_data = {};

// Load gtag library
//
(function () {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://www' : 'http://www') + '.googletagmanager.com/gtag/js?id=' + Analytics.ga_tracking_id;
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// ASAP, set communication layer, send time stamp, set configuration
//
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', Analytics.ga_tracking_id, { 'send_page_view': false });


// Event router
//
// All calls can be made by populating Analytics.event_type and Analytics.event_data
// with the necessary information, and then calling this function, Analytics.CaptureEvent
//
Analytics.CaptureEvent = function () {
  'use strict';

  var event_type, event_data;

  event_type = Analytics.event_type;
  event_data = Analytics.event_data;

  switch (event_type) {
    case 'page_view':
      Analytics.PageView(event_data.title, event_data.location, event_data.path);
      break;
    case 'search_page_view':
      Analytics.PageViewFromSearchResult(event_data.title, event_data.location, event_data.path, event_data.query);
      break;
    case 'page_click':
      Analytics.PageClickEvent();
      break;
    case 'page_first_scroll':
      Analytics.PageFirstScrollEvent();
      break;
    case 'toolbar_button_click':
      Analytics.ToolbarButtonClickEvent();
      break;
    case 'menu_click_toc':
      Analytics.MenuTOCClickEvent();
      break;
    case 'menu_click_index':
      Analytics.MenuIndexClickEvent();
      break;
    case 'topic_lookup':
      Analytics.TopicLookupEvent(event_data.context, event_data.topic_alias);
      break;
    default:
      break;
  }

  Analytics.ClearEventData();
};

Analytics.ClearEventData = function () {
  'use strict';

  Analytics.event_type = '';
  Analytics.event_data = {};
};

// Track page view
//
Analytics.PageView = function (param_title, param_location, param_path) {
  'use strict';

  gtag('js', new Date());
  gtag('config', Analytics.ga_tracking_id, { 'page_title': param_title, 'page_location': param_location, 'page_path': param_path });
};

// Track page view that resulted from a search result click
//
Analytics.PageViewFromSearchResult = function (param_title, param_location, param_path, param_query) {
  'use strict';

  var path_query = param_path + '?q=' + param_query;

  gtag('js', new Date());
  gtag('config', Analytics.ga_tracking_id, { 'page_title': param_title, 'page_location': param_location, 'page_path': path_query });
  gtag('event', 'view_search_results', { 'event_label': param_query, 'event_category': 'engagement' });
};

// Track page click event
//
Analytics.PageClickEvent = function () {
  'use strict';

  gtag('js', new Date());
  gtag('event', 'click', { 'event_label': 'page content', 'event_category': 'engagement' });
};

// Track first page scroll event
//
Analytics.PageFirstScrollEvent = function () {
  'use strict';

  gtag('js', new Date());
  gtag('event', 'scroll', { 'event_label': 'page content', 'event_category': 'engagement' });
};

// Track (Non-interactive) toolbar click event
//
Analytics.ToolbarButtonClickEvent = function () {
  'use strict';

  gtag('js', new Date());
  gtag('event', 'click', { 'event_label': 'toolbar button', 'event_category': 'engagement', 'non_interaction': true });
};

// Track (Non-interactive) menu click event
//
Analytics.MenuTOCClickEvent = function () {
  'use strict';

  gtag('js', new Date());
  gtag('event', 'click', { 'event_label': 'menu - toc', 'event_category': 'engagement', 'non_interaction': true });
};

// Track (Non-interactive) menu click event
//
Analytics.MenuIndexClickEvent = function () {
  'use strict';

  gtag('js', new Date());
  gtag('event', 'click', { 'event_label': 'menu - index', 'event_category': 'engagement', 'non_interaction': true });
};

// Track (Non-interactive) topic lookup event
//
Analytics.TopicLookupEvent = function (param_context, param_topic_alias) {
  'use strict';

  var context_topic = param_context + '/' + param_topic_alias;

  gtag('js', new Date());
  gtag('event', 'topic lookup', { 'event_label': context_topic, 'event_category': 'engagement', 'non_interaction': true });
};

// Track (Non-interactive) search event
//
Analytics.SearchEvent = function (param_query) {
  'use strict';
  gtag('js', new Date());
  gtag('event', 'search', { 'event_label': param_query, 'event_category': 'engagement', 'non_interaction': true });
};