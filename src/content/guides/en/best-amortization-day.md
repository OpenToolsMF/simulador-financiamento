---
layout: layouts/guide.njk
contentKind: guide
contentId: best-amortization-day
locale: en
order: 6
category: amortization
title: "What is the best day to make an extra payment on a loan?"
seoTitle: "Best day to make an extra loan payment: before or after the due date?"
description: "There is no universal date. Learn when an extra payment reduces principal, whether to wait for the scheduled payment and how to measure the cost of delay."
cardDescription: "Separate the due date, payment date and reference date to find when an extra payment actually starts reducing the cost of a loan."
socialImage:
  path: "assets/image/social/best-amortization-day-en.png"
  alt: "A calendar and timeline show that the due date, payment, processing and balance reduction may happen on different dates."
tags: [best day, due date, extra payment, principal, processing, reference date, outstanding balance]
published: "2026-08-12"
updated: "2026-08-12"
dataDependencies: [bcb]
toc:
  - { id: date-that-matters, label: "The date that actually matters" }
  - { id: before-or-after, label: "Before or after the payment?" }
  - { id: cost-of-waiting, label: "How to measure the cost of waiting" }
  - { id: quick-questions, label: "Quick questions" }
contractNotes:
  - "A contract may use calendar or business days, proportional interest, anniversary dates, index reference dates and its own rounding rules."
  - "Overdue payments, arrears, grace periods, minimum amounts and payment allocation rules may change when and how much of the contribution reaches principal."
  - "FGTS transactions have their own eligibility, documentation and processing rules and should not be treated as an ordinary in-app extra payment."
limitations:
  - "The example uses regular monthly periods; it does not reproduce daily interest, banking calendars, clearing time, backdated reference dates or contract anniversaries."
  - "The analysis assumes the decision to prepay has already been made; it does not compare debt with investments or recommend using emergency savings."
  - "The contract and the lender's formal quote govern the transaction; the statement issued after processing should replace any projection."
sources:
  - { label: "Brazilian Consumer Protection Code, article 52, paragraph 2 — Planalto", url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", reviewed: "2026-08-12" }
  - { label: "Central Bank of Brazil — debts that may be repaid early", url: "https://www.bcb.gov.br/meubc/faqs/p/dividas-que-podem-ser-liquidadas-antecipadamente", reviewed: "2026-08-12" }
  - { label: "Central Bank of Brazil — interest rates", url: "https://www.bcb.gov.br/estatisticas/txjuros", reviewed: "2026-08-12" }
  - { label: "Itaú — mortgage amortization options", url: "https://www.itau.com.br/atendimento-itau/para-voce/credito-imobiliario/posso-fazer-amortizacoes-no-meu-contrato-quais-as-minhas-opcoes", reviewed: "2026-08-12" }
  - { label: "CAIXA — housing contract frequently asked questions", url: "https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-contrato/Paginas/default.aspx", reviewed: "2026-08-12" }
relatedGuideIds: [financing-basics, term-or-payment, tr-balance, bank-payment-difference]
relatedSimulationIds: [term-vs-payment, extra-20k-year-five]
---
<h2 id="date-that-matters">The date that actually matters</h2>

There is no single best calendar day for every loan. This guide starts from four assumptions: you have already decided to make an extra payment, the money is available, the contract is current, and both alternatives use the same amount and goal. Under those conditions, the best time tends to be the first reference date on which the payment actually reduces the <a href="{{ 'financing-basics' | contentHref('guide', generatedPage) }}">loan principal</a>.

<aside class="content-callout" aria-label="Direct answer">
  <strong>Direct answer</strong>
  <p>The day after the due date is useful advice only when it is the first date on which the lender allows or applies the extra payment—or when the contract rules make the complete quote better on that date. There is no general “due date plus one” rule.</p>
</aside>

Brazilian consumers have the right to repay debt early, in full or in part, with a proportional reduction in interest and other additions. That right does not establish a particular day of the month for the transaction.

<div class="content-formula" role="math" aria-label="New balance equals the balance updated to the reference date minus the amount applied to principal">new balance = balance updated to the reference date − amount applied to principal</div>

The words **amount applied to principal** matter. The amount paid and the amount that reaches principal may differ when a payment is overdue or the contract allocates proportional interest, adjustment, charges or other amounts first.

### Request, payment and balance effect can have different dates

| Moment | What it represents | What to confirm |
|---|---|---|
| Request | When the transaction is requested or quoted | How long the quote remains valid |
| Payment | When funds leave the account or the bill is paid | Which date the contract will recognize |
| Processing | When the lender's system records or displays the event | Whether the update was applied using an earlier date |
| Reference date | The date used to update and reduce the balance | How much reached principal and what the new balance is |
| New balance | The result used for the following schedule | Whether the schedule was recalculated using the chosen goal |

<ol class="amortization-timeline" aria-label="Timeline from the request to the new outstanding balance">
  <li class="amortization-timeline-step">
    <span class="amortization-timeline-number" aria-hidden="true">1</span>
    <div><strong>Request</strong><span>You request or preview the transaction.</span></div>
  </li>
  <li class="amortization-timeline-step">
    <span class="amortization-timeline-number" aria-hidden="true">2</span>
    <div><strong>Payment</strong><span>The funds leave the account or the bill clears.</span></div>
  </li>
  <li class="amortization-timeline-step amortization-timeline-variable">
    <span class="amortization-timeline-number" aria-hidden="true">3</span>
    <div><strong>Processing</strong><span>Timing may vary; the visible update can happen later.</span></div>
  </li>
  <li class="amortization-timeline-step amortization-timeline-reference">
    <span class="amortization-timeline-number" aria-hidden="true">4</span>
    <div><strong>Reference date</strong><span>The date used in the calculation may precede the update shown on screen.</span></div>
  </li>
  <li class="amortization-timeline-step amortization-timeline-result">
    <span class="amortization-timeline-number" aria-hidden="true">5</span>
    <div><strong>New balance</strong><span>This is where the financial comparison begins.</span></div>
  </li>
</ol>

Official lender channels illustrate why these moments must be separated: payment, processing and the visible balance update are not necessarily the same event. A stated processing time also does not, by itself, reveal which date the contract uses in its financial calculation. Do not rely only on the date when the new balance appeared. Check the **reference date**, the **amount actually applied to principal** and the **balance after the event** on the statement.

<h2 id="before-or-after">Before or after the scheduled payment?</h2>

Advice to make the extra payment “the next day” usually comes from an operational sequence:

1. the scheduled payment becomes due and is paid;
2. the lender records it as settled;
3. the app enables the extra-payment option;
4. the borrower pays on the first available date.

In that situation, the following day may be convenient. Its advantage is that it may be the first operationally available date—not that it has a universal financial property.

<aside class="content-callout content-callout-neutral" aria-label="Due-date caution">
  <strong>Do not confuse two different actions</strong>
  <p>Making an extra payment after the scheduled payment has been processed does not mean paying the scheduled amount after its due date. Keep the regular payment on time. A late payment may create charges and prevent an extra payment until the contract is current.</p>
</aside>

<section class="amortization-situation-guide" aria-labelledby="situation-guide-title">
  <h3 id="situation-guide-title">Which situation describes your loan?</h3>
  <p>The comparison begins only when the funds are available without compromising the savings you need. If they are not available yet, the first possible date is when they become available.</p>
  <ul class="amortization-situation-list">
    <li class="amortization-situation-card">
      <h4>The extra payment can be applied today</h4>
      <p>The funds are available, the contract is current and the lender confirms that the payment can reduce principal using today's date.</p>
      <p class="amortization-situation-action"><strong>Guidance:</strong> use the first effective date available and verify the result on the statement.</p>
    </li>
    <li class="amortization-situation-card">
      <h4>The transaction depends on the scheduled payment settling</h4>
      <p>The app blocks extra payments while a scheduled payment remains open, or the lender says the option will become available only after processing.</p>
      <p class="amortization-situation-action"><strong>Guidance:</strong> pay the scheduled amount on time and make the extra payment on the first date the option becomes available. This does not mean delaying the scheduled payment.</p>
    </li>
    <li class="amortization-situation-card">
      <h4>The rule is unclear or the contract has pending issues</h4>
      <p>The update may appear days later, the contract may have outstanding charges, or the transaction may follow a separate process such as FGTS.</p>
      <p class="amortization-situation-action"><strong>Guidance:</strong> bring the loan current when necessary and obtain official confirmation of the effective date and the amount that will reach principal before comparing.</p>
    </li>
  </ul>
  <div class="amortization-verification">
    <h4>After the transaction, check three values on the statement</h4>
    <ul class="amortization-verification-list">
      <li><strong>Reference date:</strong> when the contract treats the principal reduction as having occurred.</li>
      <li><strong>Amount applied to principal:</strong> how much of the payment actually reduced the debt.</li>
      <li><strong>New balance:</strong> which amount will govern the remaining payments or term.</li>
    </ul>
  </div>
</section>

Suppose a payment is due on the 10th and funds are available on the 3rd. If the lender accepts the transaction on the 3rd and uses that date to reduce principal, waiting until the 11th leaves a larger balance in place for longer. If the lender enables extra payments only after the regular payment has settled, the first enabled date becomes the practical reference.

### “After the payment, the whole amount goes to principal” does not settle the comparison

An extra payment made after the due date may appear to remove more installments because the scheduled payment has already reduced the balance, adjustment has been posted or the reference date has changed between two quotes. Interest did not vanish: it may have been paid moments earlier inside the scheduled payment.

To find which option cost less, add every payment and compare the remaining debt on the same date. A different count of installments removed is not proof of savings on its own. The choice to <a href="{{ 'term-or-payment' | contentHref('guide', generatedPage) }}">reduce the term or lower the payment</a> also changes how results should be read.

<h2 id="cost-of-waiting">How to measure the cost of waiting</h2>

A valid comparison starts from the same contract snapshot and changes only the timing of the extra payment:

| Assumption held constant | Earlier scenario | Later scenario |
|---|---|---|
| Balance, rate and adjustment | Identical | Identical |
| Extra amount | Same contribution | Same contribution |
| Goal | Same goal | Same goal |
| Extra-payment date | First effective date | A later effective date |

Then carry both cash flows to the same comparison date or payoff and compare total cash paid, accumulated interest and adjustment, the amount applied to principal, outstanding balance, and the remaining term or payments.

<div class="content-formula" role="math" aria-label="Cost of waiting equals the future cost of the later scenario minus the future cost of the earlier scenario">cost of waiting = future cost of later scenario − future cost of earlier scenario</div>

When the scenarios have the same principal, contribution and costs and exclude variable adjustment, the difference in total payments is the difference in interest. For indexed loans, both scenarios must use the same <a href="{{ 'tr-balance' | contentHref('guide', generatedPage) }}">TR or other index path</a>.

### Calculated example: extra payment in month 60 or month 61

Mapa das Parcelas calculates regular monthly periods. This example therefore compares one full cycle rather than particular calendar days. Both variants use SAC and the same contribution to reduce future payments while preserving the term. The rate, source reference, tables, charts and cost of waiting are generated at build time instead of being copied into this article.

{% scenarioModule "amortization-timing", generatedPage %}

The balance curves may almost meet again after the later contribution because the regular amortization processed before recalculation is not identical in both variants. That crossing does not prove that waiting was cheaper. The correct indicator is the complete cash flow displayed by the module under the same assumptions.

To reconcile the projection with a real statement, see <a href="{{ 'bank-payment-difference' | contentHref('guide', generatedPage) }}">why a lender's payment may differ from the simulator</a>.

### Before confirming the transaction

| Question | Where to check |
|---|---|
| Has the current scheduled payment been paid and settled? | App, account history or statement |
| Which date will be used in the calculation? | Extra-payment quote or calculation memorandum |
| Is the displayed amount the total payment or the net principal reduction? | Transaction breakdown |
| Will it reduce the term or future payments? | Confirmation screen and new schedule |
| When will the new balance and cash flow be available? | Lender's processing rules |
| Did the full amount reach principal? | Statement issued after the transaction |

You can also <a href="{{ 'term-vs-payment' | contentHref('simulation', generatedPage) }}">compare reducing the term with lowering payments</a> or open the <a href="{{ 'extra-20k-year-five' | contentHref('simulation', generatedPage) }}">fifth-year extra-payment example</a>.

<h2 id="quick-questions">Quick questions</h2>

<section class="guide-local-faq" aria-label="Frequently asked questions for this guide">
  <div class="faq-list">
    <details class="faq-item">
      <summary>Is the day after the due date always best?</summary>
      <div class="faq-answer"><p>No. It may be the first date when some lenders enable the transaction, but it is not a universal rule. What matters is the reference date on which the payment reduces principal.</p></div>
    </details>
    <details class="faq-item">
      <summary>Can I make an extra payment on the same day as the scheduled payment?</summary>
      <div class="faq-answer"><p>It may be possible, but processing order varies. Pay the scheduled amount on time and confirm whether the extra payment will reach principal, which reference date will apply and when the new schedule will be available.</p></div>
    </details>
    <details class="faq-item">
      <summary>Does SAC or Price change the best day?</summary>
      <div class="faq-answer"><p>The system changes how payments and balances are recalculated, but it does not create a universal date. Under either system, compare the same amount, reference date and goal.</p></div>
    </details>
    <details class="faq-item">
      <summary>Does TR make the following day always better?</summary>
      <div class="faq-answer"><p>No. TR and other indexes may change the balance according to the contract's reference date, but that effect must be checked in the quote and statement. The number of installments removed does not prove which date had the lower cost.</p></div>
    </details>
  </div>
</section>
