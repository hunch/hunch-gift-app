import os

from django.core.urlresolvers import reverse

from djangoappengine.utils import on_production_server

from shortcuts import render_response, json_response

from app import config

# load the app/templatetags file for all views
from django.template.loader import add_to_builtins
add_to_builtins('app.templatetags')

def landing(request):
    return render_response('landing.html', {'is_prod': on_production_server}, request)

def recommend(request, twitter_name):
    args = {
        'twitter_name': twitter_name,
        'recommend_url': reverse('apps-gifts'),
        'HOSTNAME': config.HOSTNAME,
        'page': config.PAGINATION,
        }
    return render_response('recommend.html', args, request)

def intro(request):
    args = {
        'twitter_url': reverse('apps-gifts')
        }
    return render_response('search.html', args, request)
