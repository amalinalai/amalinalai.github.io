/**
 * @file Comments control
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
(function Controls(ns) {
	ns.CommentForm = class CommentForm extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;
		titleText;
		discordURL;
		encodedPath;
		fallbackEmail;

		//#region element properties
		formEl;
		titleEl;
		bannerEl;

		dispNameInpt;
		emailInpt;
		websiteInpt;
		respToInpt;
		commentInpt;

		resetBtn;
		submitBtn;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = CommentForm.instanceCount++;
			CommentForm.instanceMap[this.instanceId] = this;
		}

		get idKey() {
			return `gw-comment-form-${this.instanceId}`;
		}

		connectedCallback() {
			if (this.isInitialized) { return; }

			this.titleText = this.getAttribute("titleText") || "Add a Comment";

			this.renderContent();

			this.isInitialized = true;
		}

		renderContent() {
			//Markup
			this.innerHTML = `
			<form  id="${this.idKey}-form"
				aria-labelledby="${this.idKey}-title"
				aria-describedby="${this.idKey}-banner"
				class="comment-form"
				autocomplete="off" action="https://docs.google.com/forms/d/e/1FAIpQLSeP9WX1oxQteg9BkXtsyzWHXw56i8y9yTD-0WCpDitkIXN45w/formResponse" method="POST" onsubmit="alert('success');" target="succ"
			>
				<span id="${this.idKey}-title" class="comment-form-title">${this.titleText}</span>
				<div class="input-horizontal-flex">
					<div class="input-vertical">
						<label for="${this.idKey}-dispName">Display name*</label>
						<input name="entry.1481947837" id="${this.idKey}-dispName" type="text" maxlength="1000" required="true">
					</div>
					<div class="input-vertical">
						<label name="entry.2120040718" for="${this.idKey}-email">Email</label>
						<input id="${this.idKey}-email" type="email">
					</div>
					<div class="input-vertical">
						<label name="entry.1048918834" for="${this.idKey}-website">Website</label>
						<input id="${this.idKey}-website" type="text" maxlength="1000">
					</div>
					<div class="input-vertical">
						<label name="entry.1602657806" for="${this.idKey}-respTo">Response to</label>
						<input id="${this.idKey}-respTo" type="number">
					</div>
				</div>
				<div class="comment-box-container">
					<div class="input-vertical">
						<label name="entry.565441684" for="${this.idKey}-comment">Comment*</label>
						<textarea  id="${this.idKey}-comment"
							minlength="1"
							maxlength="1000"
							required="true"
							rows="5"
							cols="33"
						></textarea>
					</div>
				</div>
				<div id="${this.idKey}-banner" class="inline-banner" aria-live="polite">
					<gw-icon iconKey="circle-info" title="info"></gw-icon>
					<span>Comments are manually approved</span>
				</div>
				<div class="form-footer">
					<input id="${this.idKey}-reset" type="reset" value="Reset">
					<input id="${this.idKey}-submit" type="submit" value="Submit">
				</div>
			</form>
			`;

			//element properties
			this.formEl = document.getElementById(`${this.idKey}-form`);
			this.titleEl = document.getElementById(`${this.idKey}-title`);
			this.bannerEl = document.getElementById(`${this.idKey}-banner`);

			this.dispNameInpt = document.getElementById(`${this.idKey}-dispName`);
			this.emailInpt = document.getElementById(`${this.idKey}-email`);
			this.websiteInpt = document.getElementById(`${this.idKey}-website`);
			this.respToInpt = document.getElementById(`${this.idKey}-respTo`);
			this.commentInpt = document.getElementById(`${this.idKey}-comment`);

			this.resetBtn = document.getElementById(`${this.idKey}-reset`);
			this.submitBtn = document.getElementById(`${this.idKey}-submit`);

			//default values
			this.dispNameInpt.value = localStorage.getItem("comment-name") || "";
			this.emailInpt.value = localStorage.getItem("comment-email") || "";
			this.websiteInpt.value = localStorage.getItem("comment-website") || "";
		}

	};
	customElements.define("gw-comment-form", ns.CommentForm);

	ns.CommentList = class CommentList extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		static Data = [];
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;
		gSpreadsheetId;
		gSheetId;
		isNewestFirst;
		gwCommentFormId;

		//#region element properties
		articleEl;
		replyBtn;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = CommentList.instanceCount++;
			CommentList.instanceMap[this.instanceId] = this;
			CommentList.Data[this.instanceId] = {};
		}

		get idKey() {
			return `gw-comment-list-${this.instanceId}`;
		}

		connectedCallback() {
			if (this.isInitialized) { return; }

			this.gSpreadsheetId = this.getAttribute("gSpreadsheetId");
			this.gSheetId = this.getAttribute("gSheetId");
			this.isNewestFirst = this.getAttribute("isNewestFirst");
			this.gwCommentFormId = this.getAttribute("gwCommentFormId");

			this.loadAndRender();

			this.isInitialized = true;
		}

		async loadAndRender() {
			this.innerHTML = `
			<div class="inline-banner">
				<gw-icon iconkey="circle-info" title="info"></gw-icon>
				<span>Comments loading....</span>
			</div>
			`

			const sheetReader = new GW.Gizmos.GoogleSheetsReader(this.gSpreadsheetId, this.gSheetId);
			await sheetReader.loadData();
			this.innerHTML = "";

			const allComments = sheetReader.rowData;
			if (this.isNewestFirst) {
				allComments.reverse();
			}

			this.renderContent();
			this.registerHandlers();

			const allCommentsIndex = {};
			const topLevelCommentIdxs = [];
			const childCommentIdxs = [];
			for (let i = 0; i < allComments.length; i++) {
				const comment = allComments[i];
				allCommentsIndex[comment.ID] = i;
				if (!comment.ResponseTo) {
					topLevelCommentIdxs.push(i);
				}
				else {
					childCommentIdxs.push(i);
				}
			}
			childCommentIdxs.forEach(childIdx => {
				const replyId = allComments[childIdx].ResponseTo;
				const respondeeComment = allComments[allCommentsIndex[replyId]];

				respondeeComment.ChildIdxs = respondeeComment.ChildIdxs || [];
				respondeeComment.ChildIdxs.push(childIdx);
			});

			let commentsToBuild = [];
			topLevelCommentIdxs.forEach(
				topCommentIdx => commentsToBuild.push({
					parent: this.containerEl,
					comment: allComments[topCommentIdx]
				})
			);

			while (commentsToBuild.length > 0) {
				let { parent, comment } = commentsToBuild.shift();
				if (!comment.Timestamp) {
					continue;
				}

				CommentList.Data[this.instanceId][comment.ID] = comment;

				parent.insertAdjacentHTML("beforeend", `
				<gw-comment-card  id="${this.idKey}-cmt-${comment.ID}"
					listInstance=${this.instanceId}
					commentId=${comment.ID}
					gwCommentFormId=${this.gwCommentFormId || ""}
				></gw-comment-card>
				`);

				const commentEl = document.getElementById(`${this.idKey}-cmt-${comment.ID}`);
				(comment.ChildIdxs || []).forEach(
					childIdx => commentsToBuild.push({
						parent: commentEl.articleEl,
						comment: allComments[childIdx]
					})
				);
			}
		}

		renderContent() {
			//Markup
			this.innerHTML = `
			<div id="${this.idKey}-container" class="comments-container"">
			</div>
			`;

			//element properties
			this.containerEl = document.getElementById(`${this.idKey}-container`);
		}

		//#region Handlers
		registerHandlers() {
		}
		//#endregion
	};
	customElements.define("gw-comment-list", ns.CommentList);

	ns.CommentCard = class CommentCard extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;

		commentId;
		gwCommentFormId;

		replyToId;
		numChildren;
		commenterName;
		datetime;
		websiteURL;
		commentText;

		//#region element properties
		articleEl;
		replyBtn;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = CommentCard.instanceCount++;
			CommentCard.instanceMap[this.instanceId] = this;
		}

		get idKey() {
			return `gw-comment-card-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback() {
			if (this.isInitialized) { return; }
			
			this.commentId = this.getAttribute("commentId");
			this.gwCommentFormId = this.getAttribute("gwCommentFormId");

			const commentData = ns.CommentList.Data[this.getAttribute("listInstance")][this.commentId];

			this.replyToId = commentData.ResponseTo;
			this.numChildren = (commentData.ChildIdxs || []).length;
			this.commenterName = commentData["Display Name"];
			this.datetime = commentData.Timestamp;
			this.websiteURL = commentData.Website;
			this.commentText = this.parseCommentText(commentData.Comment);

			this.renderContent();
			this.registerHandlers();

			this.isInitialized = true;
		}
		//#endregion

		renderContent() {
			let headerText = this.replyToId
				? `Comment #${this.commentId} replying to #${this.replyToId}`
				: `Top level comment #${this.commentId}`;
			headerText += ` with ${this.numChildren} direct ${this.numChildren == 1 ? "reply" : "replies"}`;

			const displayTimestamp = this.datetime.toLocaleString(
				undefined,
				{ dateStyle: "short", timeStyle: "short" }
			);

			const commenterNameEl = this.websiteURL
				? `<a href="${this.websiteURL}" target="_blank" class="commenter-name">${this.commenterName}</a>`
				: `<span class="commenter-name">${this.commenterName}</span>`;

			//Markup
			this.innerHTML = `
			<article  id="${this.idKey}-article"
				aria-labelledby="${this.idKey}-header"
				class="comment-article"
			>
				<div id="${this.idKey}-header" class="comment-header">
					<div class="comment-id" role="img" aria-label="${headerText}">
						<span aria-hidden="true" class="comment-id">#${this.commentId}</span>
					</div>
					${commenterNameEl}
					<div class="comment-header-right">
						<time id="${this.idKey}-timestamp"
							datetime="${this.datetime.toISOString()}"
							tabindex="-1"
						>${displayTimestamp}</time>
						<button id="${this.idKey}-show" class="show-comment">Show #${this.commentId}</button>
					</div>
				</div>
				<blockquote>${this.commentText}</blockquote>
				<div class="comment-footer">
					<button id="${this.idKey}-reply">Reply to #${this.commentId}</button>
					<button id="${this.idKey}-hide">Hide #${this.commentId}</button>
				</div>
			</article>
			`;

			//element properties
			this.articleEl = document.getElementById(`${this.idKey}-article`);
			this.timestamp = document.getElementById(`${this.idKey}-timestamp`);
			this.replyBtn = document.getElementById(`${this.idKey}-reply`);
			this.hideBtn = document.getElementById(`${this.idKey}-hide`);
			this.showBtn = document.getElementById(`${this.idKey}-show`);
		}

		//#region Handlers
		registerHandlers() {
			this.replyBtn.onclick = this.onReply;
			this.hideBtn.onclick = this.onHide;
			this.showBtn.onclick = this.onShow;
		}

		onReply = () => {
			const gwCommentForm = document.getElementById(this.gwCommentFormId);
			const respToInpt = gwCommentForm.respToInpt;
			if (!respToInpt) {
				alert("Comment form not found");
				return;
			}

			respToInpt.value = this.commentId;
			respToInpt.focus();
		};

		onHide = () => {
			this.classList.add("collapsed");
			this.showBtn.focus();
		};

		onShow = () => {
			this.classList.remove("collapsed");
			this.timestamp.focus();
		};
		//#endregion

		parseCommentText(commentString) {
			let commentText = "";
			let linkObj = {};

			for(let i = 0; i < commentString.length; i++){
				let char = commentString.charAt(i);
				switch (char) {
					case '[':
						linkObj = {tStart: i};
						break;
					case ']':
						if(linkObj.tStart !== undefined && linkObj.tStart !== i-1) {
							linkObj.tEnd = i;
						}
						else { linkObj = {}; }
						break;
					case '(':
						if(linkObj.tEnd !== undefined && linkObj.tEnd === i-1) {
							linkObj.lStart = i;
						}
						else { linkObj = {}; }
						break;
					case ')':
						if(linkObj.lStart !== undefined && linkObj.lStart !== i-1) {
							linkObj.lEnd = i;
						}
						else { linkObj = {}; }
						break;
				}
				if(linkObj.lEnd !== undefined) {
					const linkText = commentString.substring(linkObj.tStart + 1, linkObj.tEnd);
					const linkURL = commentString.substring(linkObj.lStart + 1, linkObj.lEnd);
					commentText = commentText.substring(0, commentText.length - (i - linkObj.tStart));
					commentText += `<a href="${linkURL}" target="_blank">${linkText}</a>`;
					linkObj = {};
				}
				else {
					commentText += char;
				}
			}
			return commentText;
		}
	};
	customElements.define("gw-comment-card", ns.CommentCard);
}) (window.GW.Controls = window.GW.Controls || {});