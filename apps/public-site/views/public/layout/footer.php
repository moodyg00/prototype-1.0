	<?php include __DIR__ . '/page-ad-modal.php'; ?>

	<footer class="site-footer">
		<div class="site-footer__inner">

			<div class="site-footer__brand">
				<img class="site-footer__logo" src="images/logo_orange.svg" alt="Moody Home Services logo">
				<div class="site-footer__brand-text">
					<strong>Moody Home Services</strong>
					<p>Serving Austin, Cedar Park, Leander,<br>Round Rock &amp; surrounding areas.</p>
				</div>
			</div>

			<div>
				<p class="site-footer__nav-heading">Pages</p>
				<nav class="site-footer__nav" aria-label="Footer navigation">
					<a href="index.php">Home</a>
					<a href="blog.php">Blog</a>
					<a href="about.php">About</a>
					<a href="area.php">Area We Serve</a>
					<a href="reviews.php">Reviews</a>
				</nav>
			</div>

			<div>
				<p class="site-footer__contact-heading">Contact</p>
				<div class="site-footer__contact">
					<a href="<?php echo htmlspecialchars(get_public_sms_href(), ENT_QUOTES, 'UTF-8'); ?>">512-592-9226</a>
					<span>Text or call for a free quote</span>
					<span>Austin, TX</span>
				</div>
			</div>

		</div>
		<div class="site-footer__legal">
			<p>&copy; <?php echo date('Y'); ?> Moody Home Services. All rights reserved.</p>
		</div>
	</footer>
</body>
</html>
