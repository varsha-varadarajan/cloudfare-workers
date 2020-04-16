const url = "https://cfw-takehome.developers.workers.dev/api/variants";
const NAME = 'cloudfare-internship'

class ElementHandler {
    constructor(variant) {
        this.variant = variant;
    }

    element(element) {
        if (this.variant == '1') {
            element.setInnerContent(replacement_var1[element.tagName])
        } else {
            element.setInnerContent(replacement_var2[element.tagName])
        }        
    }
}

class AttributeRewriter {
    constructor(attributeName, variant) {
        this.attributeName = attributeName
        this.variant = variant;
    }

    element(element) {
        const attribute = element.getAttribute(this.attributeName)
        if (attribute) {
            if (this.variant == '1') {
                element.setAttribute(this.attributeName, replacement_var1[this.attributeName])
            } else {
                element.setAttribute(this.attributeName, replacement_var2[this.attributeName])
            }
        }
    }
}

const replacement_var1 = {
    title: 'Varsha Variant 1',
    h1: 'Varsha\'s Variant 1',
    p: 'You just got lucky today! Head over to VV\'s LinkedIn',
    href: 'https://www.linkedin.com/in/varsha-varadarajan/',
    a: 'Varsha Varadarajan LinkedIn'
}

const replacement_var2 = {
    title: 'Varsha Variant 2',
    h1: 'Varsha\'s Variant 2',
    p: 'You just got double lucky today! Head over to VV\'s Github',
    href: 'https://github.com/varsha-varadarajan',
    a: 'Varsha Varadarajan GitHub'
}

const rewriter1 = new HTMLRewriter()
    .on('title', new ElementHandler('1'))
    .on('h1#title', new ElementHandler('1'))
    .on('p#description', new ElementHandler('1'))
    .on('a#url', new ElementHandler('1'))
    .on('a#url', new AttributeRewriter('href', '1'))

const rewriter2 = new HTMLRewriter()
    .on('title', new ElementHandler('2'))
    .on('h1#title', new ElementHandler('2'))
    .on('p#description', new ElementHandler('2'))
    .on('a#url', new ElementHandler('2'))
    .on('a#url', new AttributeRewriter('href', '2'))

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    return fetch(url, { method: 'GET' })
        .then(async (response) => {
            if (response.status == 200) {
                const cookie = request.headers.get('cookie')
                if (cookie && cookie.includes(`${NAME}=variant2`)) {
                    return {
                        response: response.json(),
                        cookie: 'variant2'
                    }
                } else if (cookie && cookie.includes(`${NAME}=variant1`)) {
                    return {
                        response: await response.json(),
                        cookie: 'variant1'
                    }
                } else {
                    return {
                        response: await response.json(),
                        cookie: 'none'
                    }
                }
            } else {
                console.error(error);
                throw new Error('Something went wrong');
            }
        })
        .then(async data => {
            const VARIANT1_RESPONSE = fetch(data.response.variants[0]);
            const VARIANT2_RESPONSE = fetch(data.response.variants[1]);

            if (data.cookie == 'variant2') {
                let response = await VARIANT2_RESPONSE;
                return rewriter1.transform(response);
            } else if (data.cookie == 'variant2') {
                let response = await VARIANT1_RESPONSE;
                return rewriter2.transform(response);
            } else {
                let group = Math.random() < 0.5 ? 'variant1' : 'variant2' // 50/50 split
                let response_variant = group === 'variant1' ? VARIANT1_RESPONSE : VARIANT2_RESPONSE;
                let rewriter = group === 'variant1' ? rewriter1 : rewriter2;
                let response = await response_variant;
                var headers = new Headers();
                for (var kv of response.headers.entries()) {
                    headers.append(kv[0], kv[1]);
                }
                headers.append('Set-Cookie', `${NAME}=${group}; path=/`);
                response.headers = headers;
                return rewriter.transform(response);
            }
        })
        .catch(error => {
            console.error(error);
        });
}
