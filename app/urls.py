from django.conf.urls.defaults import *

urlpatterns = patterns(
    '',

    # App
    url(r'^gifts/$', 'app.views.intro', name='apps-gifts'),
    url(r'^gifts/(?P<twitter_name>\w+)/$', 'app.views.recommend'),
)
