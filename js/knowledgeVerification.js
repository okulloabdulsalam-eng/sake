/**
 * Knowledge Verification - Verifies knowledge coverage and system integrity
 * Ensures all required domains have sufficient sources
 */

class KnowledgeVerification {
    constructor() {
        this.requiredDomains = [
            'strategy', 'medicine', 'economics', 'finance', 'social',
            'psychology', 'leadership', 'power', 'systems', 'learning'
        ];
        this.minSourcesPerDomain = 10;
    }

    // Verify complete knowledge coverage
    async verifyCoverage() {
        if (typeof knowledgeEngine === 'undefined') {
            return {
                success: false,
                error: 'Knowledge Engine not initialized'
            };
        }

        const coverage = knowledgeEngine.verifyCoverage();
        const report = knowledgeEngine.getCoverageReport();

        const verification = {
            timestamp: Date.now(),
            totalSources: report.totalSources,
            domains: report.domains,
            sufficientDomains: report.sufficientDomains,
            allSufficient: report.allSufficient,
            coverage: coverage,
            missingDomains: [],
            insufficientDomains: [],
            recommendations: []
        };

        // Check each domain
        this.requiredDomains.forEach(domain => {
            const domainCoverage = coverage[domain];
            if (!domainCoverage) {
                verification.missingDomains.push(domain);
                verification.recommendations.push(`Add sources for domain: ${domain}`);
            } else if (!domainCoverage.sufficient) {
                verification.insufficientDomains.push({
                    domain: domain,
                    current: domainCoverage.count,
                    required: this.minSourcesPerDomain
                });
                verification.recommendations.push(
                    `Domain "${domain}" has ${domainCoverage.count} sources, needs ${this.minSourcesPerDomain}`
                );
            }
        });

        verification.success = verification.allSufficient && 
                              verification.missingDomains.length === 0 &&
                              verification.insufficientDomains.length === 0;

        return verification;
    }

    // Verify quest generation uses knowledge sources
    verifyQuestKnowledgeBacking(quest) {
        if (!quest) {
            return { valid: false, reason: 'Quest is null' };
        }

        // Check if quest has knowledge source
        if (!quest.knowledgeSource) {
            return { 
                valid: false, 
                reason: 'Quest missing knowledge source',
                recommendation: 'Quest should be generated from knowledge engine'
            };
        }

        // Validate knowledge source structure
        const source = quest.knowledgeSource;
        if (!source.sourceId || !source.sourceTitle || !source.author) {
            return {
                valid: false,
                reason: 'Knowledge source missing required fields',
                missing: {
                    sourceId: !source.sourceId,
                    sourceTitle: !source.sourceTitle,
                    author: !source.author
                }
            };
        }

        // Check if principle exists
        if (!source.principle) {
            return {
                valid: false,
                reason: 'Knowledge source missing principle'
            };
        }

        return { valid: true };
    }

    // Verify offline functionality
    async verifyOfflineFunctionality() {
        const checks = {
            sourcesCached: false,
            indexBuilt: false,
            databaseAccessible: false,
            questGenerationWorks: false
        };

        try {
            // Check if sources are cached
            const cachedSources = await db.getKnowledgeSources();
            checks.sourcesCached = cachedSources && cachedSources.length > 0;

            // Check if index is built
            if (typeof knowledgeIndex !== 'undefined') {
                const stats = knowledgeIndex.getStats();
                checks.indexBuilt = stats.totalDomains > 0;
            }

            // Check database accessibility
            try {
                await db.getAllQuests();
                checks.databaseAccessible = true;
            } catch (e) {
                checks.databaseAccessible = false;
            }

            // Check quest generation
            if (typeof knowledgeEngine !== 'undefined' && checks.sourcesCached) {
                try {
                    const testQuest = await knowledgeEngine.generateQuestFromKnowledge('strategy');
                    checks.questGenerationWorks = testQuest !== null;
                } catch (e) {
                    checks.questGenerationWorks = false;
                }
            }
        } catch (error) {
            console.error('[Verification] Error checking offline functionality:', error);
        }

        return {
            allChecksPass: Object.values(checks).every(v => v === true),
            checks: checks
        };
    }

    // Generate comprehensive verification report
    async generateVerificationReport() {
        console.log('[Knowledge Verification] Generating comprehensive report...');

        const coverage = await this.verifyCoverage();
        const offline = await this.verifyOfflineFunctionality();

        const report = {
            timestamp: Date.now(),
            coverage: coverage,
            offline: offline,
            summary: {
                knowledgeCoverage: coverage.success,
                offlineFunctionality: offline.allChecksPass,
                overallStatus: coverage.success && offline.allChecksPass ? 'PASS' : 'NEEDS_ATTENTION'
            }
        };

        // Log report
        console.log('[Knowledge Verification] Report:', report);

        return report;
    }

    // List all knowledge domains and source counts
    listDomains() {
        if (typeof knowledgeEngine === 'undefined') {
            return { error: 'Knowledge Engine not initialized' };
        }

        const domains = knowledgeEngine.getDomains();
        const domainDetails = {};

        domains.forEach(domain => {
            const sources = knowledgeEngine.getSourcesByDomain(domain);
            domainDetails[domain] = {
                count: sources.length,
                sufficient: sources.length >= this.minSourcesPerDomain,
                sources: sources.map(s => ({
                    id: s.id,
                    title: s.title,
                    author: s.author
                }))
            };
        });

        return domainDetails;
    }
}

// Export singleton instance
const knowledgeVerification = new KnowledgeVerification();

// Auto-verify on load if knowledge engine is ready
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        // Wait a bit for knowledge engine to initialize
        setTimeout(async () => {
            if (typeof knowledgeEngine !== 'undefined' && knowledgeEngine.sources.length > 0) {
                const report = await knowledgeVerification.generateVerificationReport();
                if (!report.summary.overallStatus === 'PASS') {
                    console.warn('[Knowledge Verification] System needs attention:', report);
                } else {
                    console.log('[Knowledge Verification] All checks passed!');
                }
            }
        }, 2000);
    });
}


