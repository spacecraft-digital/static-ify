function showService(d){var elements=document.getElementsByClassName('service')
for(var i=0;i<elements.length;i++){elements[i].style.display="none";}
document.getElementById(d).style.display="block";}
function showForm(d){var elements=document.getElementsByClassName('form')
for(var i=0;i<elements.length;i++){elements[i].style.display="none";}
document.getElementById(d).style.display="block";}
function bindEvent(el,eventName,eventHandler){if(el.addEventListener){el.addEventListener(eventName,eventHandler,false);}else if(el.attachEvent){el.attachEvent('on'+eventName,eventHandler);}}
var element=document.getElementById('categoryLinkButton');if(typeof(element)!='undefined'&&element!=null){bindEvent(element,'click',function(){var e=document.getElementById("categorySelectBox");var selected=e.options[e.selectedIndex].value;top.location.href=selected;});}
var element=document.getElementById('formLinksButton');if(typeof(element)!='undefined'&&element!=null){bindEvent(element,'click',function(){var e=document.getElementById("formSelectBox");var selected=e.options[e.selectedIndex].value;top.location.href=selected;});}
if(typeof jQuery!='undefined'){jQuery(document).ready(function($){$('.mapLayerSelection input:checkbox').prop('checked',true);$('.mapLayerSelection input').click(function(e){var directoryId=$(this).attr('id').replace('layer_checkbox_','');var checked=$(this).is(':checked');for(pos=0;pos<inMyAreaGMapMarker.length;++pos){if(inMyAreaGMapMarker[pos].directoryId.toString()==directoryId){inMyAreaGMapMarker[pos].setVisible(checked);}}});});}