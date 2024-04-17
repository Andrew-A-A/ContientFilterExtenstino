const reader = new FileReader();
let image=new Image();
let inputImage = document.querySelector('input[type="file"]');
var images=document.querySelectorAll("img");
document.getElementById('upload').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      reader.onload = function() {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = `<img src="${reader.result}" class="img-fluid" style="max-width: 100px;">`;
        image.src=reader.result;
        // Simulating processing of the loaded image
        const resultText = document.getElementById('resultText');
        resultText.innerHTML = `<p>Image processed successfully!</p>`;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('predict').onclick= async function(){

    //document.getElementById("resultText").innerHTML=prediction;

    let formData = new FormData();
    formData.append('img',image);
    formData.append('image', inputImage.files[0]);

    if(!formData.has('image'))
      console.log("image Not loaded")
    else
      console.log("image loaded")

    if(!formData.has('img'))
      console.log("img Not loaded")
    else
      console.log("img loaded")

    // Example code snippet in your extension's JavaScript
    // Get your image file (e.g., from user input or storage)
    
    fetch('http://127.0.0.1:5000/process-image', {
        method: 'POST',
        body: formData,
    }).then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
      
    // url='http://127.0.0.1:5000/process-image'
    // fetch(url, {
    //   method: "POST",
    //   body: JSON.stringify({
    //     userId: 1,
    //     img: image,
    //     completed: false
    //   }),
    //   headers: {
    //     "Content-type": "application/json; charset=UTF-8"
    //   }
    // }).then(response => response.json()).then(data => {
    //       console.log('Response from Flask:', data);
    //       // Handle the processed data (e.g., display it to the user)
    //   }).catch(error => console.error('Error:', "error"));
  }


 

inputImage.addEventListener('change', function() {
    let formData = new FormData();
    formData.append('image', inputImage.files[0]);

    if(!formData.has('image'))
      console.log("image Not loaded")
    else
    console.log("image loaded")

    fetch('http://127.0.0.1:5000/test', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
});


const grabBtn=document.getElementById("grabBtn");
grabBtn.addEventListener("click",()=>{
  alert("clicked");
})

chrome.tabs.query({active: true},(tabs)=>{
  const tab=tabs[0];
  if(tab){
    executeScript(tab);
  }else{
    alert("Not tabs active")
  }
})

function grabImages() {
  // Query all images on a target web page
  // and return an array of their URLs
  images= document.querySelectorAll("img");
  images=Array.from(images);
  console.log("GrabImage() called");
  return images.map(image=>image.src);
}

// function grabText(){
//   //Query all paragraphs on a target web page
//   //and return an array of their text
//   paragraphs=document.querySelectorAll("*");
//   paragraphs=Array.from(paragraphs);
//   console.log("GrabParagraphs() called");
//   return paragraphs.map(paragraph=>paragraph.innerText);

// }
function grabText() {
  // Query all text nodes on a target web page
  // and return an array of their text
  const textNodes = [];
  const walk = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walk.nextNode()) {
    textNodes.push(walk.currentNode);
  }

  console.log("GrabText() called");
  return textNodes.map(node => node.textContent);
}

/**
 * Executed after all grabImages() calls finished on 
 * remote page
 * Combines results and copy a list of image URLs 
 * to clipboard
 * 
 * @param {[]InjectionResult} frames Array 
 * of grabImage() function execution results
 */
function onResult(frames) {
  // If script execution failed on the remote end 
  // and could not return results
  if (!frames || !frames.length) { 
      alert("Could not retrieve images from specified page");
      return;
  }
  // Combine arrays of the image URLs from 
  // each frame to a single array
  let imageUrls = frames.map(frame=>frame.result)
                          .reduce((r1,r2)=>r1.concat(r2));
  // Copy to clipboard a string of image URLs, delimited by 
  // carriage return symbol  
  // window.navigator.clipboard
  //       .writeText(imageUrls.join("\n"))
  //       .then(()=>{
  //          // close the extension popup after data 
  //          // is copied to the clipboard
  //          window.close();
  //       });
  alert("Sent");
  formData=new FormData();
  console.log(imageUrls)
  imageUrls=imageUrls.filter((url)=> url.includes('.png') ||url.includes('.jpeg')||url.includes('.jpg'))

  formData.append("images",imageUrls)

  if(formData.has("images")){
    console.log(imageUrls);
  }
  else{
    console.log("NO IMAGES");
  }
  let predictionsResponse
  fetch('http://127.0.0.1:5000/upload-urls', {
    method: 'POST',
    body: formData,
  }).then(response => response.json())
  .then(data =>{ 
    console.log(data);
    predictionsResponse=data['prediction']
    console.log(predictionsResponse);
    images=Array.from(images)
    for(var i = 0; i < imageUrls.length; i++){
      if(predictionsResponse[imageUrls[i]]=="Violence"){
        // Blur
        console.log(imageUrls[i]);
        const imageUrl = imageUrls[i];
        chrome.tabs.query({active: true},(tabs)=>{
          const tab=tabs[0];
          if(tab){
            chrome.scripting.executeScript(
              {
                  target:{tabId: tab.id, allFrames: true},
                  func:blurImage,
                  args:[imageUrl]
              },
              () => {
                console.log("ggEZ"); // This will be executed after the script execution is complete
            }
          )
          }else{
            alert("Not tabs active")
          }
        })
        console.log("Blurred");
        // console.log(imageUrls[i]);
      }
    }
  })
  .catch(error => console.error(error));

}
function onTextResult(results) {
  // If script execution failed on the remote end 
  // and could not return results
  if (!results ||!results.length) { 
      alert("Could not retrieve text from specified page");
      return;
  }

  // Combine arrays of the text content from 
  // each frame to a single array

  let textContent = results.reduce((acc, result) => {
      console.log(result['result'])
      return acc.concat(result['result']);
  }, []);

  // Log the text content to the console
  console.log("Text content:", textContent);
  let formTextData=new FormData();
  formTextData.append("textData",textContent)

  // Do something with the text content, such as sending it to a server
  // for further processing
  fetch('http://127.0.0.1:5000/upload-text', {
    method: 'POST',
    body: formTextData,
  })
 .then(response => response.json())
 .then(data => {
    // Handle the processed data (e.g., display it to the user)
    console.log(data);
    text_prediction_dict=data["TextPrediction"];
    // for(var i=0;i<textContent.length;i++){
    //  if(text_prediction_dict[i]=="Toxic"){
    //   console.log("Toxic Text blurred");
    //   console.log(textContent[i]);
    //   blurToxicText(textContent[i])
    //  }
    // }
    let i=0
    console.log("SZ");
    console.log(Object.keys(text_prediction_dict).length);
    console.log(textContent);
    Object.entries(text_prediction_dict).forEach(([key, value]) => {
           if(value=="Toxic"){
      console.log("Toxic Text blurred");
      console.log(key);
      const textToBlur=textContent[i];
      console.log("text to Blur");
      console.log(textToBlur);
      chrome.tabs.query({active: true},(tabs)=>{
        const tab=tabs[0];
        if(tab){
          chrome.scripting.executeScript(
            {
                target:{tabId: tab.id, allFrames: true},
                func:blurToxicText,
                args:[key]
            },
            () => {
              console.log("ggEZ2"); // This will be executed after the script execution is complete
          }
        )
        }else{
          alert("Not tabs active")
        }
      })
     }
     i++;
  });
  })
 .catch(error => console.error('Error:', error));
}

function executeScript(tab) {
  // Execute a function on a page of the current browser tab
  // and process the result of execution
  chrome.scripting.executeScript(
      {
          target:{tabId: tab.id, allFrames: true},
          func:grabImages
      },
      onResult
  )
  chrome.scripting.executeScript(
   {
    target:{tabId:tab.id,allFrames:true},
    func:grabText
   },
    onTextResult
  )
}

// Function to blur an image
function blurImage(imageUrl) {
  console.log("blur() called");
  console.log(imageUrl);
  var images = document.getElementsByTagName('img');

    for (var i = 0; i < images.length; i++) {
        // Check if the image source matches the provided URL
        if (images[i].src == imageUrl) {
            // Apply a CSS blur filter to the image
            images[i].style.filter = 'blur(30px)';
        }
    }
}

// This is a simplified example and might not work in all cases
function blurToxicText(toxicText) {
  console.log("toxicTextBlured()")
  console.log(toxicText)
  function getTextNodesIn(node) {
    var textNodes = [];
    if (node.nodeType == Node.TEXT_NODE) {
        textNodes.push(node);
    } else {
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            textNodes.push.apply(textNodes, getTextNodesIn(children[i]));
        }
    }
    return textNodes;
  }
  // Get all text nodes in the body
  var textNodes = getTextNodesIn(document.body);

  // Loop through each text node
  for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];

      // If the text node contains the toxic text
      if (node.nodeValue.toLowerCase().includes(toxicText)) {
          // Create a new span element
          var span = document.createElement('span');

          // Set the span's text content to the toxic text
          span.textContent = toxicText;

          // Apply a blur style to the span
          span.style.filter = 'blur(5px)';

          // Replace the toxic text in the text node with the new span
          node.parentNode.replaceChild(span, node);
      }
  }
}

// Helper function to get all text nodes in an element
function getTextNodesIn(node) {
  var textNodes = [];
  if (node.nodeType == Node.TEXT_NODE) {
      textNodes.push(node);
  } else {
      var children = node.childNodes;
      for (var i = 0; i < children.length; i++) {
          textNodes.push.apply(textNodes, getTextNodesIn(children[i]));
      }
  }
  return textNodes;
}


// Iterate over the images

// for (var i = 0; i < images.length; i++) {
//   var img = images[i];

//   // Send the image to your server for classification
//   fetch('https://your-server.com/classify', {
//       method: 'POST',
//       body: JSON.stringify({ imageUrl: img.src }),
//       headers: { 'Content-Type': 'application/json' }
//   })
//   .then(response => response.json())
//   .then(data => {
//       // If the image is classified as violent, blur it
//       if (data.isViolent) {
//           blurImage(img);
//       }
//   });
// }