fetch("config/config.json")
.then(response => response.json())
.then(data => {

let html="";

data.documents.forEach(doc=>{

html += `
<div>

<h3>${doc.title}</h3>

<p>${doc.category}</p>

<a href="${doc.file}" target="_blank">
Buka PDF
</a>

<hr>

</div>
`;

});

document.getElementById("documentList").innerHTML=html;

});
