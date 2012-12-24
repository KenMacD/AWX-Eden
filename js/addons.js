/*
 *  AWX - Ajax based Webinterface for XBMC
 *  Copyright (C) 2012  MKay, mizaki
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>
 */
 
/*-----------------------------*/
/* Addons and addon functions  */
/*-----------------------------*/

var addons = {};

(function($) {
  $.extend(addons, {
      
    getAddons: function(options) {
      var settings = {
        enabled: true,
        content: 'unknown',
        onSuccess: null,
        onError: null
      };
      $.extend(settings, options);
      
      xbmc.sendCommand(
        '{"jsonrpc": "2.0", "method": "Addons.GetAddons", "params": { "enabled": ' + settings.enabled + ', "content": "' + settings.content + '", "properties": [ "name", "thumbnail", "version", "author" ] }, "id": "libAddons"}',
        function(reponse) {
          settings.onSuccess(reponse.result);
        },
        settings.onError
      );
    },
    
    getAddonDetails: function(options) {
      var settings = {
        addonid: '',
        onSuccess: null,
        onError: null
      };
      $.extend(settings, options);
      
      xbmc.sendCommand(
        '{"jsonrpc": "2.0", "method": "Addons.GetAddonDetails", "params": { "addonid": "' + settings.addonid + '", "properties": [ "enabled", "name", "thumbnail", "fanart", "version", "author" ] }, "id": "libAddonDets"}',
        function(reponse) {
          settings.onSuccess(reponse.result);
        },
        settings.onError
      );
    },
    
    exeAddon: function(options) {
      var settings = {
        addonid: true,
        wait: true,
        params: '', //"mediatype=tvshow", "medianame=Last Resort"
        onSuccess: null,
        onError: null
      };
      $.extend(settings, options);
      
      xbmc.sendCommand(
        '{"jsonrpc": "2.0", "method": "Addons.ExecuteAddon", "params": { "wait": ' + settings.wait + ', "addonid": "' + settings.addonid + '", "params": [ ' + settings.params + ' ] },  "id": "libExeAddon"}',
        settings.onSuccess,
        settings.onError
      );
    },
    
    /*-----------------------------*/
    // script.cu.lrclyrics support //
    /*-----------------------------*/
    
    culrcLyrics: function(options) {
      var parse = function (txt) {
        return new Lrc(txt, function(text, extra){
          if(!text){ return }
          var lrcs = this.lrc.split(/\r\n|\r|\n/);
        });
      };
      var lrcDisplay = function(lyrics) {
        $('#lyrics').empty();
        if (lyrics.lines.length > 0) {
          $('div#lyricInfo').append((lyrics.tags.title !=''? '<span class="label">' + mkf.lang.get('Track:', 'Label') + ' </span><span class="info">' + lyrics.tags.title + '</span> ' : '' ) +
          (lyrics.tags.artist !=''? '<span class="label">- ' + mkf.lang.get('Artist:', 'Label') + ' </span><span class="info">' + lyrics.tags.artist + '</span> ' : '' ) +
          (lyrics.tags.album !=''? '<span class="label">- ' + mkf.lang.get('Album:', 'Label') + ' </span><span class="info">' + lyrics.tags.album + '</span> ' : '' ) +
          (lyrics.tags.by !=''? '<span class="label">- ' + mkf.lang.get('Lyrics:', 'Label') + ' </span><span class="info">' + lyrics.tags.by + '</span> ' : '' ));
          $.each(lyrics.lines, function(i, line) {
            $('#lyrics').append('<div class="lyricline"><span class="time" style="display: none">#' + Math.round(line.time/1000) + '</span><span class="lyric">' + line.txt + '</span></div>');
          });
        } else {
          //Normal
          var lines = lyrics.lrc.split(/\r\n|\r|\n/);
          $.each(lines, function(i, line) {
            $('#lyrics').append('<div class="lyricline"><span class="lyric">' + line + '</span></div>');
          });
        }
      };
      
      //Check it's enabled and a supported version
      addons.getAddonDetails({
        addonid: 'script.cu.lrclyrics',

        onError: function() {
          return false;
        },

        onSuccess: function(response) {
          if (response.addon.enabled && response.addon.version > '1.0.1') {
            xbmc.getInfoLabels({
              labels: ['Window(Home).Property(culrc.lyrics)', 'Window(Home).Property(culrc.source)' , 'Window(Home).Property(culrc.running)'],
              onError: function() {
                return false;
              },
              onSuccess: function(response) {
                if (response['Window(Home).Property(culrc.running)'] != 'true') {
                  //start culrc
                  console.log('running');
                  console.log(response['Window(Home).Property(culrc.running)']);
                  addons.exeAddon({
                    addonid: 'script.cu.lrclyrics',
                    onError: function() {
                      return false;
                    },
                    onSuccess: function() { setTimeout(function() { addons.culrcLyrics() }, 3000) }
                  });
                } else if (response['Window(Home).Property(culrc.lyrics)'] == '') {
                  //console.log('empty lyrics');
                  $('div#lyrics').append('...');
                  setTimeout(function() { console.log('empty lyrics'); addons.culrcLyrics() }, 5000);
                } else {
                  var lrc = parse(response['Window(Home).Property(culrc.lyrics)']);
                  $('div#lyricInfo').empty();
                  lrcDisplay(lrc);
                  $('div#lyricInfo').append('<span class="label">' + mkf.lang.get('Source', 'Label') + ': </span><span class="info">' + response['Window(Home).Property(culrc.source)'] + '</span>');
                }
              }
            });
          };
        }
      });
    }
    
  }); // END addons
})(jQuery);