---
generated: 2026-08-15
category: Technical Standards
document_count: 7
requirement_count: 119
---

## CISA-OT-Asset-Inventory-Guidance
- **Source**: Foundations for OT Cybersecurity: Asset Inventory Guidance for Owners and Operators
- **URL**: https://www.cisa.gov/resources-tools/resources/foundations-ot-cybersecurity-asset-inventory-guidance-owners-and-operators
- **Requirement count**: 26
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Periodically review and update the asset taxonomy and inventory to reflect changes in technology and operations.
    - _T2 Risk-Informed · all_: Validate inventory accuracy and completeness by cross-checking collected data and creating visual diagrams of asset categories.
- **Governance**:
    - _T2 Risk-Informed · all_: Define governance over asset management, identifying the authority requiring the inventory and the offices responsible for establishing and maintaining it.
    - _T2 Risk-Informed · all_: Assign specific roles and responsibilities for data collection and validation within the asset inventory process.
    - _T2 Risk-Informed · all_: Document the roles and responsibilities of personnel interacting with assets, including operators, technicians, vendors, and integrators.
    - _T2 Risk-Informed · all_: Identify asset inventory owners to oversee updates and validate asset classifications to ensure ongoing accuracy, maintenance, and reporting of the OT asset inventory.
    - _T2 Risk-Informed · all_: Develop reporting mechanisms to track asset performance, maintenance activities, and compliance with policies.
    - _T2 Risk-Informed · all_: Conduct regular reviews of the inventory and audits of the asset management program to ensure it remains effective and aligned with organizational goals.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create an organized, regularly updated list of OT systems, hardware, and software to identify assets requiring security and protection.
    - _T2 Risk-Informed · all_: Develop an OT taxonomy to categorize and prioritize assets based on function and criticality to aid risk identification and vulnerability management.
    - _T2 Risk-Informed · all_: Define scope and objectives, identify assets, collect attributes, and create a taxonomy as part of a systematic inventory process.
    - _T2 Risk-Informed · all_: Conduct physical inspections and logical surveys to compile a comprehensive list of OT assets and network infrastructure dependencies.
    - _T2 Risk-Informed · all_: Collect high-priority asset attributes including criticality, role, hostname, IP/MAC addresses, OS, location, and supported protocols.
    - _T2 Risk-Informed · all_: Create an OT taxonomy to classify and categorize assets based on criticality, function, zones, and conduits to streamline inventory management.
    - _T2 Risk-Informed · all_: Establish a centralized database or asset management system to store and manage asset data, implementing security controls for protection.
    - _T2 Risk-Informed · all_: Capture high-priority asset inventory fields including Asset Criticality, Asset Role/Type, Hostname, IP Address, Manufacturer, Model, and Operating System to enable vulnerability determination and risk management.
    - _T2 Risk-Informed · all_: Capture medium-priority asset inventory fields including Department/Owner, Firmware/Software Version, OS Version, and Physical or Virtual status to provide context and vulnerability data.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Implement asset life cycle management to maintain an accurate and up-to-date record of OT assets.
    - _T2 Risk-Informed · all_: Define asset life cycle stages including acquisition, deployment, commissioning, maintenance, and decommissioning.
    - _T2 Risk-Informed · all_: Develop policies for managing assets throughout their life cycle, including maintenance schedules, replacement plans, and backup strategies.
    - _T2 Risk-Informed · all_: Require asset inventory updates for the introduction or removal of devices in all cases, including under emergency change authority.
    - _T2 Risk-Informed · all_: Use change management processes to accurately track OT asset modifications, additions, and decommissioning.
- **Observability**:
    - _T2 Risk-Informed · all_: Use the asset inventory for performance monitoring and reporting to enhance security posture and ensure reliability.
    - _T2 Risk-Informed · all_: Implement real-time monitoring to detect emerging threats and vulnerabilities associated with OT assets.
    - _T2 Risk-Informed · all_: Cross-reference asset inventories with vulnerability databases like CISA KEV and MITRE CVE to identify known vulnerabilities and patches.
    - _T2 Risk-Informed · all_: Continuously monitor asset performance and status, prioritizing process variable monitoring and network/system diagnostics to detect performance issues, maintenance needs, and communication health.

## CMMC-L2-Assessment-Guide
- **Source**: CMMC Level 2 Assessment Guide
- **URL**: https://dodcio.defense.gov/Portals/0/Documents/CMMC/AssessmentGuideL2v2.pdf
- **Requirement count**: 29
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.
    - _T3 Repeatable · libraries_: Employ FIPS-validated cryptography to protect the confidentiality of CUI when transmitted or stored outside the protected environment.
    - _T3 Repeatable · software_: Use cryptographic mechanisms that meet FIPS-validated criteria to prevent unauthorized disclosure of CUI during transmission.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document password complexity rules, including minimum character counts and required character types, in the organization's security policy.
    - _T2 Risk-Informed · all_: Define and document the number of password generations during which reuse is prohibited in the company's security policy.
    - _T2 Risk-Informed · all_: Establish an operational incident-handling capability that includes preparation, detection, analysis, containment, recovery, and user response activities.
    - _T2 Risk-Informed · all_: Write a specific policy for removable media covering types and company approach.
    - _T2 Risk-Informed · all_: Include controls in policy to limit removable media use to the smallest number needed.
    - _T2 Risk-Informed · all_: Include controls in policy to scan all removable media for viruses.
    - _T2 Risk-Informed · all_: Establish policy that only organization-issued USB drives may be used.
    - _T2 Risk-Informed · all_: Establish policy that USB drives are to be used for work purposes only.
    - _T2 Risk-Informed · all_: Remind employees via policy that plugging unknown devices is prohibited.
    - _T2 Risk-Informed · all_: Direct staff to turn in devices with no identifiable owner to IT help desk.
    - _T2 Risk-Informed · all_: Ensure employees undergo organization-defined screening before accessing CUI.
    - _T2 Risk-Informed · all_: Base screening types on requirements for a given position and role.
    - _T2 Risk-Informed · all_: Develop, document, and periodically update system security plans describing boundaries, environments, and security requirement implementation.
    - _T2 Risk-Informed · all_: Define the frequency for updating the system security plan and ensure updates occur at least annually.
    - _T2 Risk-Informed · all_: Provide a plan for monitoring the state of security controls on a recurring basis to support risk-based decisions.
    - _T2 Risk-Informed · all_: Define time frames within which system flaws are identified, reported, and corrected for all systems.
    - _T2 Risk-Informed · all_: Develop a policy requiring checking vendor websites for flaw notifications and assessing severity for patching.
    - _T2 Risk-Informed · all_: Create a policy requiring devices that do not support encryption to be signed out, kept in possession, and locked up when not in use.
    - _T2 Risk-Informed · certificates_: Maintain digital certificates and replace them with new ones before expiration to ensure session authenticity.
    - _T2 Risk-Informed · keys_: Establish and manage cryptographic keys for cryptography employed in organizational systems.
    - _T2 Risk-Informed · keys_: Define key management requirements in accordance with applicable federal laws, policies, directives, regulations, and standards.
    - _T2 Risk-Informed · software_: Establish organizational policies defining approved VoIP technologies and enforcing appropriate usage guidelines.
    - _T3 Repeatable · all_: Define, document, approve, and enforce physical and logical access restrictions for system changes.
    - _T3 Repeatable · all_: Track, review, approve, and log all changes to organizational systems.
    - _T3 Repeatable · all_: Analyze the security impact of changes prior to implementation.
    - _T3 Repeatable · all_: Configure systems to provide only essential capabilities based on least functionality.

## CMMC-L2-Scoping-Guide
- **Source**: CMMC Level 2 Scoping Guidance
- **URL**: https://dodcio.defense.gov/Portals/0/Documents/CMMC/ScopingGuideL2v2.pdf
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Document all in-scope assets in an asset inventory and provide a network diagram of the CMMC Assessment Scope.
    - _T2 Risk-Informed · all_: Document the treatment of CUI, Security Protection, CRMAs, and Specialized Assets in the System Security Plan (SSP).
    - _T2 Risk-Informed · all_: Manage Contractor Risk Managed Assets using the organization's risk-based information security policy, procedures, and practices.
    - _T2 Risk-Informed · all_: Justify the inability of Out-of-Scope Assets to store, process, or transmit CUI.
    - _T2 Risk-Informed · all_: Document specialized assets in the SSP and detail how they are managed using the OSA's risk-based information security policy, procedures, and practices.
    - _T2 Risk-Informed · all_: Document each specialized asset in the asset inventory and in the SSP to show management via risk-based security policies.
    - _T2 Risk-Informed · all_: Provide documentation that specifies the CMMC Assessment Scope to the assessor.
    - _T2 Risk-Informed · all_: Document the use of an External Service Provider, its relationship to the OSA, and services provided in the SSP and CRM.
    - _T2 Risk-Informed · all_: Document or refer to security requirements from the Customer Responsibility Matrix in the OSA's SSP for assessment.

## DFARS-252.204-7012
- **Source**: DFARS 252.204-7012: Safeguarding Covered Defense Information and Cyber Incident Reporting
- **URL**: https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting.
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Implement NIST SP 800-171 security requirements for covered contractor information systems, or obtain DoD CIO approval for alternatives.
    - _T2 Risk-Informed · all_: Submit written requests to the Contracting Officer to vary from NIST SP 800-171 requirements for consideration by the DoD CIO.
    - _T2 Risk-Informed · all_: Ensure external cloud service providers meet FedRAMP Moderate baseline security requirements for covered defense information.
    - _T2 Risk-Informed · certificates_: Acquire a DoD-approved medium assurance certificate to report cyber incidents via the designated portal.

## DoD-OT-Control-Systems-SRG
- **Source**: DoD Control Systems / OT Security Requirements Guide V2
- **URL**: https://dl.dod.cyber.mil/wp-content/uploads/external/pdf/U_Control%20Systems_OT_V2_SRG.pdf
- **Requirement count**: 39
- **Governance**:
    - _T2 Risk-Informed · all_: Establish an organizational information security policy aligned with DoD RMF to ensure consistent protection of control systems/OT.
    - _T2 Risk-Informed · all_: Implement governance and risk management processes that address cybersecurity risks using the DoD RMF.
    - _T2 Risk-Informed · all_: Establish cybersecurity roles and responsibilities for the entire workforce and third-party stakeholders.
    - _T2 Risk-Informed · all_: Coordinate and align information security roles and responsibilities with internal roles and external partners.
    - _T2 Risk-Informed · all_: Understand and manage legal and regulatory requirements regarding cybersecurity, including privacy and civil liberty obligations.
    - _T2 Risk-Informed · all_: Establish and manage risk management processes agreed to by organizational stakeholders.
    - _T2 Risk-Informed · all_: Determine and clearly express organizational risk tolerance.
    - _T2 Risk-Informed · all_: Inform risk tolerance determination by role in critical infrastructure and sector-specific risk analysis.
    - _T2 Risk-Informed · all_: Identify and prioritize risk responses considering risk tolerance and alternatives.
    - _T2 Risk-Informed · all_: Implement procedures for identifying and authenticating users, processes, and devices.
    - _T2 Risk-Informed · all_: Manage physical access to assets to prevent unauthorized modification or destruction.
    - _T2 Risk-Informed · all_: Carefully manage remote access to prevent unauthorized individuals from gaining access.
    - _T2 Risk-Informed · all_: Manage access permissions incorporating least privilege and separation of duties.
    - _T2 Risk-Informed · all_: Protect network integrity by allowing only secure connections and minimizing unnecessary connections.
    - _T2 Risk-Informed · all_: Ensure all users receive proper training on dangers, risks, and responsibilities.
    - _T2 Risk-Informed · all_: Establish and maintain tracking and management procedures for assets throughout their lifecycle.
    - _T2 Risk-Informed · all_: Create and maintain a baseline configuration of information technology/control systems.
    - _T2 Risk-Informed · all_: Implement configuration change control processes to document and test alterations.
    - _T2 Risk-Informed · all_: Conduct, maintain, and test backups of information periodically.
    - _T2 Risk-Informed · all_: Establish and communicate priorities for organizational mission, objectives, and activities as they relate to control systems/OT to mitigate social engineering threats.
    - _T2 Risk-Informed · all_: Establish, manage, and obtain agreement from organizational stakeholders on risk management processes.
    - _T2 Risk-Informed · all_: Define roles and responsibilities for detection to ensure accountability.
    - _T2 Risk-Informed · all_: Ensure personnel know their designated roles and order of operations during a response.
    - _T2 Risk-Informed · all_: Categorize incidents consistent with established response plans.
    - _T2 Risk-Informed · all_: Document newly identified vulnerabilities as accepted risks if not mitigated.
    - _T2 Risk-Informed · all_: Have a comprehensive process to predict or identify failure conditions leading to environmental harm.
    - _T2 Risk-Informed · all_: Establish and use an integrated enterprise-wide decision structure for cybersecurity risk management (RMF) that includes and integrates mission areas.
    - _T2 Risk-Informed · all_: Establish organizational information security policy.
    - _T2 Risk-Informed · all_: Establish, manage, and agree to risk management processes with organizational stakeholders.
    - _T2 Risk-Informed · all_: Identify and prioritize risk responses regarding physical controls and safeguards for control system/OT assets.
    - _T2 Risk-Informed · all_: Meet policy and regulations regarding the physical operating environment for organizational assets.
    - _T2 Risk-Informed · all_: Develop and implement a vulnerability management plan for the control system/OT environment.
    - _T2 Risk-Informed · all_: Ensure response and recovery plans are in place and managed.
    - _T2 Risk-Informed · all_: Develop and implement policies and procedures for determining log content, storage, protection, accessibility, and reviewability.
    - _T2 Risk-Informed · all_: Establish and maintain baseline configurations and inventories of organizational information systems throughout the system development life cycles.
    - _T2 Risk-Informed · all_: Establish, maintain, and effectively implement emergency response, backup operations, and post-disaster recovery plans.
    - _T2 Risk-Informed · all_: Establish an operational incident handling capability that includes preparation, detection, analysis, containment, recovery, and user response activities.
    - _T2 Risk-Informed · all_: Provide secure guidance for transporting, handling, erasing, and destroying media assets.
    - _T2 Risk-Informed · all_: Incorporate policy management software to enforce media protection policy where applicable.

## NIST SP 800-30
- **Source**: Guide for Conducting Risk Assessments (Rev. 1)
- **URL**: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Verify compliance to ensure required risk response measures are implemented and security requirements are satisfied.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish organizational risk management strategy defining key requirements for maintaining risk assessments, including factors to monitor and frequency.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Update risk assessments based on ongoing monitoring results, determining frequency and circumstances per organizational policy.
- **Observability**:
    - _T2 Risk-Informed · all_: Conduct ongoing monitoring of risk factors to ensure information for credible, risk-based decisions remains available and current.
    - _T2 Risk-Informed · all_: Monitor risk factors to maintain situational awareness of governance structures, mission processes, and information systems.

## NIST-SP-800-171Ar3
- **Source**: NIST SP 800-171Ar3: Assessing Security Requirements for CUI
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171Ar3.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Produce an assessment report documenting whether security requirements have been satisfied and analyze risks from identified weaknesses.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish organizational points of contact and obtain necessary approvals to execute the security assessment plan.
    - _T2 Risk-Informed · all_: Define the types of cryptography to be used for protecting the confidentiality of Controlled Unclassified Information (CUI).
    - _T2 Risk-Informed · keys_: Define organization-defined parameters for key generation, distribution, storage, access, and destruction requirements.
- **Inventory**:
    - _T2 Risk-Informed · all_: Define the frequency at which to review and update the system component inventory.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Define the frequency for changing or refreshing authenticators and events that trigger such changes.
- **Observability**:
    - _T2 Risk-Informed · all_: Define the frequency at which system audit records are reviewed and analyzed.
