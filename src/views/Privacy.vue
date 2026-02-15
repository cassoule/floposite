<template>
  <v-layout class="w-100">
    <v-main class="w-100 text-white">
      <div class="privacy-content pa-6">
        <h1 class="font-weight-bold">Politique de Confidentialité</h1>
        <p><em>Dernière mise à jour : 10 février 2026</em></p>

        <h2 class="font-weight-bold">1. Responsable du traitement</h2>
        <ul>
          <li><strong>Nom</strong> : Milo Gourvest</li>
          <li><strong>Statut</strong> : Micro-entrepreneur</li>
          <li><strong>Email de contact</strong> : milo.grv@gmail.com</li>
          <li><strong>Site</strong> : <a href="https://floposite.com">https://floposite.com</a></li>
        </ul>

        <h2 class="font-weight-bold">2. Données collectées</h2>
        <p>
          Dans le cadre de l'utilisation de la Plateforme FlopoBot / FlopoSite, les données
          personnelles suivantes peuvent être collectées :
        </p>

        <h3 class="font-weight-bold">2.1 Données issues de Discord</h3>
        <ul>
          <li>Identifiant Discord (ID utilisateur)</li>
          <li>Nom d'utilisateur Discord</li>
          <li>Nom d'affichage Discord</li>
          <li>URL de l'avatar Discord</li>
        </ul>
        <p>
          Ces données sont collectées lors de l'inscription sur la Plateforme et sont nécessaires au
          fonctionnement du service.
        </p>

        <h3 class="font-weight-bold">2.2 Données issues du paiement (via Stripe)</h3>
        <p>Lors d'un achat de FlopoCoins, les données suivantes sont transmises par Stripe :</p>
        <ul>
          <li>Adresse email du client</li>
          <li>Nom du client</li>
        </ul>
        <p>
          <strong>Aucune donnée bancaire</strong> (numéro de carte, CVV, etc.) n'est collectée ni
          stockée par la Plateforme. Le traitement des paiements est intégralement géré par Stripe,
          sous-traitant certifié PCI-DSS. La politique de confidentialité de Stripe est disponible à
          l'adresse :
          <a href="https://stripe.com/fr/privacy" target="_blank">https://stripe.com/fr/privacy</a>
        </p>

        <h3 class="font-weight-bold">2.3 Données d'utilisation</h3>
        <ul>
          <li>Historique des transactions (achats de FlopoCoins)</li>
          <li>Historique des actions sur la Plateforme (logs d'activité)</li>
          <li>Données de jeu (scores, parties, classement Elo)</li>
        </ul>

        <h2 class="font-weight-bold">3. Finalités du traitement</h2>
        <p>Les données collectées sont utilisées pour :</p>
        <v-table density="compact" class="my-4" theme="dark" striped="odd">
          <thead>
            <tr>
              <th>Finalité</th>
              <th>Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fourniture du service (gestion du compte, crédit de FlopoCoins)</td>
              <td>Exécution du contrat</td>
            </tr>
            <tr>
              <td>Suivi des transactions et facturation</td>
              <td>Obligation légale</td>
            </tr>
            <tr>
              <td>Gestion du classement et des scores</td>
              <td>Intérêt légitime</td>
            </tr>
            <tr>
              <td>Envoi de notifications Discord liées aux achats</td>
              <td>Exécution du contrat</td>
            </tr>
          </tbody>
        </v-table>
        <p>
          Les données ne sont <strong>jamais</strong> utilisées à des fins publicitaires, de
          profilage commercial ou de revente à des tiers.
        </p>

        <h2 class="font-weight-bold">4. Destinataires des données</h2>
        <p>Les données personnelles sont accessibles uniquement :</p>
        <ul>
          <li>
            Au responsable du traitement (Milo Gourvest), pour l'administration de la Plateforme ;
          </li>
          <li>
            À <strong>Stripe</strong>, en tant que sous-traitant de paiement, pour le traitement des
            transactions.
          </li>
        </ul>
        <p>Aucune donnée n'est transmise à d'autres tiers.</p>

        <h2 class="font-weight-bold">5. Durée de conservation</h2>
        <v-table density="compact" class="my-4" theme="dark" striped="odd">
          <thead>
            <tr>
              <th>Type de données</th>
              <th>Durée de conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Données de compte Discord</td>
              <td>Durée d'utilisation du service</td>
            </tr>
            <tr>
              <td>Données de transaction (email, nom, montant)</td>
              <td>10 ans (obligation comptable, article L123-22 du Code de commerce)</td>
            </tr>
            <tr>
              <td>Logs d'activité</td>
              <td>Conservation limitée aux dernières entrées par utilisateur</td>
            </tr>
          </tbody>
        </v-table>

        <h2 class="font-weight-bold">6. Vos droits (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données (UE) 2016/679, vous
          disposez des droits suivants :
        </p>
        <ul>
          <li>
            <strong>Droit d'accès</strong> : obtenir la communication de vos données personnelles
          </li>
          <li>
            <strong>Droit de rectification</strong> : demander la correction de données inexactes
          </li>
          <li>
            <strong>Droit à l'effacement</strong> : demander la suppression de vos données (sous
            réserve des obligations légales de conservation)
          </li>
          <li>
            <strong>Droit à la limitation</strong> : demander la limitation du traitement de vos
            données
          </li>
          <li>
            <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré
          </li>
          <li>
            <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données fondé
            sur l'intérêt légitime
          </li>
        </ul>
        <p>
          Pour exercer vos droits, envoyez un email à :
          <a href="mailto:milo.grv@gmail.com">milo.grv@gmail.com</a>
        </p>
        <p>Une réponse vous sera apportée dans un délai maximum de 30 jours.</p>
        <p>
          En cas de désaccord, vous pouvez introduire une réclamation auprès de la CNIL (Commission
          Nationale de l'Informatique et des Libertés) :
          <a href="https://www.cnil.fr" target="_blank">https://www.cnil.fr</a>
        </p>

        <h2 class="font-weight-bold">7. Sécurité des données</h2>
        <p>Les mesures suivantes sont mises en place pour protéger vos données :</p>
        <ul>
          <li>Paiements traités par Stripe (certifié PCI-DSS)</li>
          <li>Vérification des webhooks par signature cryptographique</li>
          <li>Base de données hébergée sur serveur sécurisé</li>
        </ul>

        <h2 class="font-weight-bold">8. Cookies</h2>
        <p>
          La Plateforme FlopoSite n'utilise pas de cookies de suivi ou publicitaires. Seuls des
          cookies techniques strictement nécessaires au fonctionnement du site peuvent être utilisés
          (session, préférences d'affichage).
        </p>

        <h2 class="font-weight-bold">9. Transfert de données hors UE</h2>
        <p>
          Les données de paiement sont traitées par Stripe, qui peut effectuer des transferts de
          données vers les États-Unis. Ces transferts sont encadrés par les clauses contractuelles
          types approuvées par la Commission européenne. Pour plus d'informations :
          <a href="https://stripe.com/fr/privacy" target="_blank">https://stripe.com/fr/privacy</a>
        </p>

        <h2 class="font-weight-bold">10. Modifications</h2>
        <p>
          La présente politique de confidentialité peut être modifiée à tout moment. Les
          modifications entrent en vigueur dès leur publication. L'utilisateur est invité à
          consulter régulièrement cette page.
        </p>

        <h2 class="font-weight-bold">11. Contact</h2>
        <p>
          Pour toute question relative à la protection de vos données, contactez :
          <a href="mailto:milo.grv@gmail.com">milo.grv@gmail.com</a>
        </p>
      </div>
    </v-main>
  </v-layout>
</template>

<script></script>

<style scoped>
.privacy-content {
  margin: 0 auto;
  line-height: 1.6;
}

.privacy-content h1 {
  margin-bottom: 0.5rem;
}

.privacy-content h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.privacy-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.privacy-content p {
  margin-bottom: 1rem;
}

.privacy-content ul,
.privacy-content ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.privacy-content li {
  margin-bottom: 0.5rem;
}

a {
  color: #ddd !important;
  text-decoration: underline;
  font-style: italic;
}
</style>
