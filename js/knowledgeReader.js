/**
 * Knowledge Source Reader - Read and browse knowledge sources
 */

class KnowledgeReader {
    constructor() {
        this.currentSource = null;
    }

    renderSourceLibrary() {
        const container = document.getElementById('knowledge-library');
        if (!container) return;

        if (typeof knowledgeEngine === 'undefined' || knowledgeEngine.sources.length === 0) {
            container.innerHTML = '<p class="empty-state">No knowledge sources available</p>';
            return;
        }

        const domains = knowledgeEngine.getDomains();
        let html = '';

        domains.forEach(domain => {
            const sources = knowledgeEngine.getSourcesByDomain(domain);
            html += `
                <div class="knowledge-domain-section">
                    <h3 class="panel-title">${domain.charAt(0).toUpperCase() + domain.slice(1)} (${sources.length})</h3>
                    <div class="knowledge-sources-list">
            `;

            sources.forEach(source => {
                html += `
                    <div class="knowledge-source-card" onclick="knowledgeReader.openSource('${source.id}')">
                        <div class="source-header">
                            <h4>${source.title}</h4>
                            <span class="source-author">by ${source.author}</span>
                        </div>
                        <div class="source-principles-count">
                            ${source.principles ? source.principles.length : 0} principles
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    openSource(sourceId) {
        if (typeof knowledgeEngine === 'undefined') return;

        const source = knowledgeEngine.getSource(sourceId);
        if (!source) return;

        this.currentSource = source;
        this.renderSourceView();
    }

    renderSourceView() {
        const container = document.getElementById('knowledge-reader');
        if (!container) return;

        const source = this.currentSource;
        if (!source) return;

        let html = `
            <div class="knowledge-source-view">
                <button class="btn-secondary" onclick="knowledgeReader.closeSource()" style="margin-bottom: 1rem;">← Back</button>
                <h2>${source.title}</h2>
                <p class="source-author-full">by ${source.author}</p>
                <p class="source-domain">Domain: ${source.domain}</p>
        `;

        if (source.principles && source.principles.length > 0) {
            html += `
                <div class="source-principles">
                    <h3>Key Principles</h3>
            `;
            source.principles.forEach((principle, index) => {
                html += `
                    <div class="principle-item">
                        <h4>${index + 1}. ${typeof principle === 'string' ? principle : principle.name}</h4>
                        ${typeof principle === 'object' && principle.description ? 
                            `<p>${principle.description}</p>` : ''}
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (source.frameworks && source.frameworks.length > 0) {
            html += `
                <div class="source-frameworks">
                    <h3>Frameworks</h3>
            `;
            source.frameworks.forEach(framework => {
                html += `
                    <div class="framework-item">
                        <h4>${framework.name}</h4>
                        <p>${framework.description || ''}</p>
                        ${framework.steps ? `
                            <ol>
                                ${framework.steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        ` : ''}
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (source.exercises && source.exercises.length > 0) {
            html += `
                <div class="source-exercises">
                    <h3>Practical Exercises</h3>
                    <ul>
                        ${source.exercises.map(ex => `<li>${ex}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    closeSource() {
        this.currentSource = null;
        this.renderSourceLibrary();
    }
}

const knowledgeReader = new KnowledgeReader();


