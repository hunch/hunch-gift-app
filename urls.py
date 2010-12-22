from django.conf.urls.defaults import *
from django.conf import settings

urlpatterns = patterns(
    '',

    # Landing page URL
    # (good for testing if you are on viewing the page locally or on production)
    url(r'^$', 'app.views.landing', name='landing'),

    # The app
    (r'^', include('app.urls')),
)
