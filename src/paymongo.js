const puppeteer = require('puppeteer');

class Paymongo {

    /**
     * Set paymongo credentials.
     *
     * @param username
     * @param password
     * @param namespace
     */
    setCredentials({username, password, namespace}) {
        this.username = username;
        this.password = password;
        this.namespace = namespace;
    }

    /**
     * Set options.
     *
     * @param isTest
     * @param inputDelay
     * @param isHeadless
     * @param userAgent
     */
    setOptions({isTest, inputDelay, isHeadless, userAgent}) {
        this.options = {
            isTest: isTest,
            inputDelay: inputDelay,
            isHeadless: isHeadless,
            userAgent: userAgent
        }
    }

    /**
     * Create a page.
     *
     * @returns {Promise<void>}
     */
    async createPage() {
        this.browser = await puppeteer.launch({
            headless: this.options.isHeadless,
            args: [
                // Required for Docker version of Puppeteer
                '--no-sandbox',
                '--disable-setuid-sandbox',
                // This will write shared memory files into /tmp instead of /dev/shm,
                // because Docker’s default for /dev/shm is 64MB
                '--disable-dev-shm-usage'
            ]
        });
        this.page = await this.browser.newPage();
    }

    /**
     * Get paymongo link.
     *
     * @param amount
     * @param description
     * @param otherInfo
     * @returns {Promise<{amount: *, id: *, type: *, url: *}>}
     */
    async getLink({amount, description, otherInfo}) {
        await this.createPage();
        await this.setUserAgent();
        await this.login();

        return await this.makeLink(amount, description, otherInfo);
    }

    /**
     * Set user agent.
     *
     * @returns {Promise<void>}
     */
    async setUserAgent() {
        await this.page.setUserAgent(this.options.userAgent);
    }

    /**
     * Login to paymongo.
     *
     * @returns {Promise<void>}
     */
    async login() {

        await this.page.goto('https://dashboard.paymongo.com');

        await this.page.type('input[name=email]', this.username, {delay: this.options.inputDelay});
        await this.page.type('input[name=password]', this.password, {delay: this.options.inputDelay});
        await this.page.click('button.login-form-button', {delay: this.options.inputDelay});

        await this.page.waitFor('button.generate-link-button', {visible: true});
    }

    /**
     * Make a paymongo link.
     *
     * @param amount
     * @param description
     * @param otherInfo
     * @returns {Promise<{amount, id: *, type: *, url}>}
     */
    async makeLink(amount, description, otherInfo) {

        if (this.options.isTest === true) {
            await this.enableTestMode();
        }

        await this.page.click('button.generate-link-button', {delay: this.options.inputDelay});

        await this.page.waitFor('.ant-modal', {visible: true});

        await this.page.type(this.getAmountInputSelector(), "" + amount + "", {delay: this.options.inputDelay});
        await this.page.type(this.getDescriptionInputSelector(), description, {delay: this.options.inputDelay});
        await this.page.type(this.getOtherInfoInputSelector(), otherInfo, {delay: this.options.inputDelay});
        await this.page.click(this.getCreateLinkButtonSelector(), {delay: this.options.inputDelay});

        // Wait for response.
        const response = await this.page.waitForResponse('https://gateway.paymongo.com/transactions');

        const result = await response.json();

        const data = {
            id: result.data.id,
            type: result.data.type,
            amount: result.data.attributes.amount,
            url: result.data.attributes.url
        };

        console.log("New link generated", data.url);

        return data;
    }

    /**
     * Enable test mode.
     * Links will be created in test dashboard.
     *
     * @returns {Promise<*>}
     */
    async enableTestMode() {

        await this.page.waitForSelector('.LiveSwitchComponent > button');

        const isLive = await this.page.evaluate(() => {
            return document.querySelector('.LiveSwitchComponent > button').getAttribute("aria-checked");
        });

        if (isLive === "true") {
            await this.page.click('.LiveSwitchComponent > button');
            return await this.enableTestMode();
        }
    }

    /**
     * Get amount input selector.
     *
     * @returns {string}
     */
    getAmountInputSelector() {
        return '.ant-input-affix-wrapper .ant-input';
    }

    /**
     * Get description input selector.
     *
     * @returns {string}
     */
    getDescriptionInputSelector() {
        return '.ant-form-item-children textarea[placeholder="For one (1) vanilla pupcake"]';
    }

    /**
     * Get other info input selector.
     *
     * @returns {string}
     */
    getOtherInfoInputSelector() {
        return '.ant-form-item-children textarea[placeholder="No sprinkles"]';
    }

    /**
     * Get create link button selector.
     *
     * @returns {string}
     */
    getCreateLinkButtonSelector() {
        return '.ant-modal-footer .ant-btn-primary';
    }

}

module.exports = Paymongo;