/* This small classic script paints Picot's startup view before modules load. */
{
 const script=document.currentScript;
 const loader=document.createElement('div');
 loader.id='startup-loader';
 loader.dataset.picotLoader='';
 loader.setAttribute('role','status');
 loader.setAttribute('aria-live','polite');
 loader.setAttribute('aria-busy','true');
 const spinner=document.createElement('span');
 spinner.id='startup-loader-spinner';
 spinner.dataset.picotSpinner='';
 spinner.setAttribute('aria-hidden','true');
 const message=document.createElement('span');
 message.textContent=script.dataset.startupMessage??'';
 loader.append(spinner,message);
 document.body.prepend(loader);
}
