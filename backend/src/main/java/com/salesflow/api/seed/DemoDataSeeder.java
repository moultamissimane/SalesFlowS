package com.salesflow.api.seed;

import com.salesflow.api.activity.ActivityEntityType;
import com.salesflow.api.activity.ActivityService;
import com.salesflow.api.activity.ActivityType;
import com.salesflow.api.company.Company;
import com.salesflow.api.company.CompanyRepository;
import com.salesflow.api.company.CompanyStatus;
import com.salesflow.api.contact.Contact;
import com.salesflow.api.contact.ContactRepository;
import com.salesflow.api.contact.ContactStatus;
import com.salesflow.api.deal.Currency;
import com.salesflow.api.deal.Deal;
import com.salesflow.api.deal.DealPriority;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.deal.PipelineStage;
import com.salesflow.api.lead.Lead;
import com.salesflow.api.lead.LeadRepository;
import com.salesflow.api.lead.LeadSource;
import com.salesflow.api.lead.LeadStatus;
import com.salesflow.api.task.Task;
import com.salesflow.api.task.TaskPriority;
import com.salesflow.api.task.TaskRepository;
import com.salesflow.api.task.TaskStatus;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import com.salesflow.api.user.UserRole;
import com.salesflow.api.user.UserStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a realistic demo dataset (mirroring the look of the original mocked frontend) on first
 * boot against an empty database. Deliberately implemented in Java rather than a Flyway SQL
 * migration so passwords go through the real {@link PasswordEncoder} bean instead of a
 * hand-computed BCrypt hash pasted into SQL.
 */
@Slf4j
@Component
@Profile({"dev", "docker"})
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "Passw0rd!";

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final DealRepository dealRepository;
    private final TaskRepository taskRepository;
    private final ActivityService activityService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            log.info("Demo data already present - skipping seed.");
            return;
        }
        log.info("Seeding demo data (all users share password: {})", DEMO_PASSWORD);

        User admin = user("Karim Bennani", "k.bennani@salesflow.ma", UserRole.ADMIN, "Executive / IT Management", new BigDecimal("1200000"));
        User manager = user("Youssef El Alami", "y.elalami@salesflow.ma", UserRole.SALES_MANAGER, "Enterprise Sales", new BigDecimal("1500000"));
        User agent1 = user("Sofia Chraibi", "s.chraibi@salesflow.ma", UserRole.SALES_AGENT, "Commercial & SMB Accounts", new BigDecimal("850000"));
        User agent2 = user("Amine Tazi", "a.tazi@salesflow.ma", UserRole.SALES_AGENT, "Mid-Market FinTech", new BigDecimal("900000"));
        userRepository.saveAll(List.of(admin, manager, agent1, agent2));

        Company attijari = company("Attijari Solutions Cloud", "Financial Technology & Banking", "https://attijari-cloud.ma", "Casablanca", 45_000_000, 450);
        Company iam = company("Maroc Telecom Data Labs", "Telecommunications & Cloud", "https://iam-datalabs.ma", "Rabat", 120_000_000, 1200);
        Company tangerMed = company("Tanger Med Logistics ERP", "Supply Chain & Maritime Shipping", "https://tangermed-erp.ma", "Tangier", 85_000_000, 800);
        Company hps = company("HPS Payment Systems Africa", "Electronic Payments & Switch", "https://hps-payment.com", "Casablanca", 98_000_000, 950);
        Company atlasAgro = company("Atlas Agro Supply Chain", "AgriTech & Cold Chain Export", "https://atlasagro.ma", "Agadir", 32_000_000, 280);
        Company saham = company("Saham Digital Insurance Hub", "InsurTech & Underwriting", "https://saham-digital.ma", "Casablanca", 62_000_000, 520);
        companyRepository.saveAll(List.of(attijari, iam, tangerMed, hps, atlasAgro, saham));

        Contact mehdi = contact(attijari, "Mehdi", "Mansouri", "m.mansouri@attijari-cloud.ma", "Head of Digital Banking Architecture");
        Contact nadia = contact(iam, "Nadia", "Berrada", "n.berrada@iam-datalabs.ma", "VP Cloud Infrastructure");
        Contact hamza = contact(tangerMed, "Hamza", "Idrissi", "h.idrissi@tangermed-erp.ma", "Director of Logistics Systems");
        Contact salma = contact(hps, "Salma", "Fassi", "s.fassi@hps-payment.com", "Head of Product");
        Contact rania = contact(atlasAgro, "Rania", "Ouazzani", "r.ouazzani@atlasagro.ma", "COO");
        Contact yassine = contact(saham, "Yassine", "Kabbaj", "y.kabbaj@saham-digital.ma", "CTO");
        contactRepository.saveAll(List.of(mehdi, nadia, hamza, salma, rania, yassine));

        dealRepository.saveAll(List.of(
                deal("Attijari Omnichannel Banking API Suite", attijari, mehdi, manager, new BigDecimal("480000"), PipelineStage.NEGOTIATION, DealPriority.CRITICAL, 15),
                deal("IAM Data Labs Cloud Migration", iam, nadia, manager, new BigDecimal("620000"), PipelineStage.PROPOSAL, DealPriority.HIGH, 30),
                deal("Tanger Med Port ERP Integration", tangerMed, hamza, agent1, new BigDecimal("310000"), PipelineStage.QUALIFIED, DealPriority.MEDIUM, 45),
                deal("HPS Switch Modernization", hps, salma, agent2, new BigDecimal("275000"), PipelineStage.CONTACTED, DealPriority.MEDIUM, 60),
                deal("Atlas Agro Cold Chain Tracking", atlasAgro, rania, agent1, new BigDecimal("145000"), PipelineStage.NEW_LEAD, DealPriority.LOW, 75),
                deal("Saham Underwriting Automation", saham, yassine, agent2, new BigDecimal("390000"), PipelineStage.WON, DealPriority.HIGH, -10),
                deal("Attijari Fraud Detection Add-on", attijari, mehdi, manager, new BigDecimal("210000"), PipelineStage.LOST, DealPriority.MEDIUM, -20),
                deal("HPS Regional Expansion Package", hps, salma, agent2, new BigDecimal("530000"), PipelineStage.PROPOSAL, DealPriority.HIGH, 25)));

        leadRepository.saveAll(List.of(
                lead("Casablanca FinTech Summit follow-up", "Wafa Digital Ventures", "Omar Alaoui", LeadSource.CASABLANCA_TECH_EXPO, 72, agent1),
                lead("Inbound demo request - insurance suite", "Axa Assurance Maroc", "Ines Bennis", LeadSource.INBOUND_WEB, 58, agent2),
                lead("LinkedIn outreach - port logistics", "Marsa Maroc Digital", "Karim Zerouali", LeadSource.LINKEDIN, 44, agent1),
                lead("Partner referral - retail POS", "Label Vie Tech", "Sara Amrani", LeadSource.REFERRAL, 65, manager)));

        taskRepository.saveAll(List.of(
                task("Send updated proposal to Attijari", agent1, LocalDate.now().plusDays(2), TaskPriority.HIGH),
                task("Follow up on IAM Data Labs contract redlines", agent2, LocalDate.now().plusDays(1), TaskPriority.URGENT),
                task("Schedule onboarding kickoff - Saham", manager, LocalDate.now().plusDays(5), TaskPriority.MEDIUM),
                task("Quarterly pipeline review with agents", admin, LocalDate.now().plusDays(7), TaskPriority.LOW)));

        activityService.log(ActivityEntityType.DEAL, dealRepository.findAll().get(0).getId(), "Attijari Omnichannel Banking API Suite",
                ActivityType.CALL, "Discovery call with Mehdi Mansouri",
                "Discussed integration timeline and compliance requirements.", null, manager);

        log.info("Demo data seed complete: {} users, {} companies, {} deals, {} leads, {} tasks",
                userRepository.count(), companyRepository.count(), dealRepository.count(), leadRepository.count(), taskRepository.count());
    }

    private User user(String name, String email, UserRole role, String department, BigDecimal quota) {
        return User.builder()
                .fullName(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .role(role)
                .department(department)
                .location("Casablanca, Morocco")
                .monthlyQuota(quota)
                .status(UserStatus.ACTIVE)
                .build();
    }

    private Company company(String name, String industry, String website, String city, long revenue, int employees) {
        return Company.builder()
                .name(name).industry(industry).website(website)
                .phone("+212 522 " + (100000 + name.length() * 137))
                .city(city).country("Morocco")
                .annualRevenue(BigDecimal.valueOf(revenue))
                .employeeCount(employees)
                .status(CompanyStatus.ACTIVE)
                .build();
    }

    private Contact contact(Company company, String first, String last, String email, String title) {
        return Contact.builder()
                .company(company).firstName(first).lastName(last).email(email)
                .phone("+212 661 " + (100000 + email.length() * 97))
                .jobTitle(title).status(ContactStatus.ACTIVE)
                .build();
    }

    private Deal deal(String title, Company company, Contact contact, User agent, BigDecimal value,
                       PipelineStage stage, DealPriority priority, int closeDateOffsetDays) {
        return Deal.builder()
                .title(title).company(company).contact(contact).assignedAgent(agent)
                .value(value).currency(Currency.MAD).stage(stage).probability(stage.defaultProbability())
                .priority(priority)
                .expectedCloseDate(LocalDate.now().plusDays(closeDateOffsetDays))
                .tags(new java.util.ArrayList<>(List.of("Enterprise")))
                .build();
    }

    private Lead lead(String title, String companyName, String contactName, LeadSource source, int score, User agent) {
        return Lead.builder()
                .title(title).company(companyName).contactName(contactName)
                .email(contactName.toLowerCase().replace(" ", ".") + "@example.ma")
                .phone("+212 660 " + (100000 + score * 137))
                .source(source).score(score).status(LeadStatus.NEW)
                .estimatedValue(BigDecimal.valueOf(50000L + score * 2000L))
                .assignedAgent(agent).city("Casablanca")
                .build();
    }

    private Task task(String title, User agent, LocalDate dueDate, TaskPriority priority) {
        return Task.builder()
                .title(title).assignedAgent(agent).dueDate(dueDate)
                .priority(priority).status(TaskStatus.PENDING)
                .build();
    }
}
