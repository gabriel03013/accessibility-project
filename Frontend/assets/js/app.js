import { initializeLoginPage, initializeRegisterPage } from "./auth-pages.js?v=20260727-9";
import {
  initializeCourtPage,
  initializeCreateCourtPage,
  initializeHomePage,
  initializeOwnerCourtsPage,
  initializeSavedCourtsPage,
  initializeSearchPage
} from "./court-pages.js?v=20260727-9";
import {
  initializeBookingRequestPage,
  initializeConfirmationPage,
  initializeCounterResponsePage,
  initializeMyBookingsPage,
  initializePaymentChoicePage,
  initializeRequestSentPage
} from "./booking-pages.js?v=20260727-9";
import {
  initializeChallengeProposalPage,
  initializeChallengeResponsePage,
  initializeChallengeTeamPage,
  initializeCreateTeamPage,
  initializeDiscoverTeamsPage,
  initializeInvitationPage,
  initializeInviteMembersPage,
  initializeTeamPage,
  initializeTeamsPage
} from "./team-pages.js?v=20260727-9";
import { initializeChatPage, initializeMessagesPage } from "./message-pages.js?v=20260727-9";
import {
  initializeCounterRequestPage,
  initializeOwnerAcceptedPage,
  initializeOwnerAgendaPage,
  initializeOwnerDashboardPage,
  initializeOwnerRequestPage,
  initializeOwnerRequestsPage,
  initializeRejectRequestPage
} from "./owner-pages.js?v=20260727-9";
import { initializeProfilePage } from "./profile-page.js?v=20260727-9";
import { initializeSessionUi } from "./session-ui.js?v=20260727-9";

const pageInitializers = {
  home: initializeHomePage,
  search: initializeSearchPage,
  court: initializeCourtPage,
  savedCourts: initializeSavedCourtsPage,
  ownerCourts: initializeOwnerCourtsPage,
  createCourt: initializeCreateCourtPage,
  bookingRequest: initializeBookingRequestPage,
  requestSent: initializeRequestSentPage,
  myBookings: initializeMyBookingsPage,
  paymentChoice: initializePaymentChoicePage,
  confirmation: initializeConfirmationPage,
  counterResponse: initializeCounterResponsePage,
  teams: initializeTeamsPage,
  createTeam: initializeCreateTeamPage,
  team: initializeTeamPage,
  inviteMembers: initializeInviteMembersPage,
  discoverTeams: initializeDiscoverTeamsPage,
  challengeTeam: initializeChallengeTeamPage,
  invitation: initializeInvitationPage,
  challengeProposal: initializeChallengeProposalPage,
  challengeResponse: initializeChallengeResponsePage,
  messages: initializeMessagesPage,
  chat: initializeChatPage,
  ownerRequests: initializeOwnerRequestsPage,
  ownerRequest: initializeOwnerRequestPage,
  rejectRequest: initializeRejectRequestPage,
  counterRequest: initializeCounterRequestPage,
  ownerAccepted: initializeOwnerAcceptedPage,
  ownerDashboard: initializeOwnerDashboardPage,
  ownerAgenda: initializeOwnerAgendaPage,
  profile: initializeProfilePage,
  login: initializeLoginPage,
  register: initializeRegisterPage
};

const initialize = pageInitializers[document.body.dataset.page];
Promise.resolve(initializeSessionUi()).catch(() => undefined);
Promise.resolve(initialize?.()).catch(() => undefined);
